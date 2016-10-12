var Firmware = (function () {

	/**
	 * Form for uploading of the hex file
	 * @type {string}
	 */
	var formHexUpload = "#form-hex-upload";

	/**
	 * Form for burning of the HEX file
	 * @type {string}
	 */
	var formHexBurn = "#form-firmware-upload";

	/**
	 * ID of the file
	 * @type {string}
	 */
	var fileHexUploadID = "file-hex";

	/**
	 * Content of the read file
	 * @type {string}
	 */
	var fileContent = "";

	/**
	 * Compressed byte array
	 * @type {Object}
	 */
	var currentBinaryData = {};

	/**
	 * Current status from HEX file
	 * @type {{}}
	 */
	var currentHexStatus = {};

	/**
	 * Templates for the status in the HEX file
	 * @type {{VERS: string, GUID: string, DESCR: string}}
	 */
	var templates      = {
		"VERS":  "version",
		"GUID":  "guid",
		"DESCR": "description"
	};

	return {
		/**
		 * Init events
		 */
		init:                    function () {
			this.event();
		},
		/**
		 * Register events
		 */
		event:                   function () {

			var self = this;

			$(document).ready(function () {

				App.initDictionary();

				$(document).on("change", "#file-hex", function () {
					var promises      = [];
					fileContent       = "";
					currentBinaryData = {};
					currentHexStatus  = {};
					var deferred      = $.Deferred();
					promises.push(deferred);
					self.readFileData(deferred);
					$.when.apply($, promises).then(function () {
						self.parseHexFile(fileContent);
					});
				});

				$(document).on("submit", formHexUpload, function () {
					$("body").addClass("loading");
					_.defer(function() {
						var isValid = self.parseHexFile(fileContent);
						if (!isValid) {
							$("body").removeClass("loading");
							return false;
						}
						var ajaxUploadHex      = Api.uploadHexFile(currentBinaryData.data);
						var ajaxUpdateFirmware = Api.uploadFirmwareInfo(currentHexStatus);
						self.updateCurrentStatus();
						if (_.isObject(ajaxUploadHex) && _.isObject(ajaxUpdateFirmware)) {
							$.when(ajaxUpdateFirmware, ajaxUploadHex).then(function (responseFirmware, responseHex) {
								var result = Api.checkResponseArray([responseFirmware, responseHex]);
								App.pushResponse(result, App.getTranslation("uploadHexFileSuccess", "panel"));
								$("body").removeClass("loading");
							});
						}
					});

					return false;
				});

				$(document).on("submit", formHexBurn, function () {
					$("body").addClass("loading");
					Api.burnProcessor(function(response) {
						var result   = Api.checkResponseArray([response]);
						App.pushResponse(result, App.getTranslation("burnDeviceSuccess", "panel"));
						$("body").removeClass("loading");
					});
					return false;
				});

			});
		},
		/**
		 * Read data from the file input to string
		 * @param deferred
		 */
		readFileData:            function (deferred) {
			var input = document.getElementById(fileHexUploadID);
			var file  = input.files[0];
			var fr    = new FileReader();
			fr.onload = function (event) {
				fileContent = event.target.result;
				deferred.resolve();
			};
			if (file) {
				fr.readAsText(file);
			}
			else {
				var status = this.getEmptyHexStatus();
				this.updateUploadStatus(status);
			}
		},
		/**
		 * Parse HEX files
		 * @param fileData
		 */
		parseHexFile:            function (fileData) {

			var isHeaderParsed = false;
			var status         = {};
			/**
			 * Split data by the end symbol
			 * @type {Array}
			 */
			var lines          = fileData.split("\r\n");
			if (lines.length > 6) {
				/**
				 * Go through lines and check if the line is the status line
				 */
				for (var i = 0; i < lines.length; i++) {
					if (Object.keys(status).length == Object.keys(templates).length) {
						isHeaderParsed = true;
						break;
					}
					var line = lines[i];
					/**
					 * If the line begins from ";#"
					 */
					if (line[0] == ';' && line[1] == '#') {
						line = line.substring(2, line.length);
						/**
						 * Go through each property in template and search
						 */
						for (var property in templates) {
							if (line.indexOf(property) == 0) {
								line                        = line.replace(property, "").trim();
								status[templates[property]] = line;
							}

						}
					}
				}
			}
			var isFileVaild = false;
			if (!isHeaderParsed) {
				status = this.getEmptyHexStatus();
			}
			else {
				/**
				 * Remove the header lines and the prelast checksum
				 */
				lines.splice(0, 3);
				lines = _.compact(lines);
				lines.splice(lines.length - 2, 1);
				try {
					currentBinaryData = IntelHex.parseIntelHex(lines.join("\r\n"));
					currentHexStatus  = status;
					isFileVaild       = true;
					App.clearMessage();
				}
				catch (e) {
				}
			}
			if (!isFileVaild) {
				App.pushMessage(App.getTranslation("errorNotValidFile"), "danger");
			}
			this.updateUploadStatus(status);
			return isFileVaild;
		},
		/**
		 * Returns empty state object
		 * @returns {{}}
		 */
		getEmptyHexStatus: function() {
			var status = {};
			for (var property in templates) {
				status[templates[property]] = '-';
			}
			return status;
		},
		/**
		 * Get the current firmware state of the device
		 * @returns {*|{}}
		 */
		getCurrentStatus:        function () {
			return Api.getInfo();
		},
		/**
		 * Update the current status
		 * @param state
		 */
		updateCurrentStatus:     function () {
			var state = this.getCurrentStatus();
			var blockTag = "firmware-current-state";
			var template = _.template($("[data-type=" + blockTag + "]").html());
			var block    = "." + blockTag;
			$(block).html(template({
				dictionary:  App.getDictionaryPanel(),
				currentState: state
			}));
		},
		/**
		 * Update status parsed from the hex file
		 * @param state
		 */
		updateUploadStatus:      function (state) {
			if (typeof state == 'undefined') {
				state = {};
			}
			var blockTag = "firmware-upload-hex-status";
			var template = _.template($("[data-type=" + blockTag + "]").html());
			var block    = "." + blockTag;
			$(block).html(template({
				dictionary:    App.getDictionaryPanel(),
				uploadedState: state
			}));
			$(block).slideDown();

		},
		/**
		 * Callback for the rendering of the current state view
		 * @param compiled
		 * @returns {*}
		 */
		firmwareCurrentState:    function (compiled) {
			var currentState = this.getCurrentStatus();
			return compiled({
				dictionary:   App.getDictionaryPanel(),
				currentState: currentState,
			});
		},
		/**
		 * Callback for the rendering of the default state
		 * for the uploaded file
		 * @param compiled
		 * @returns {*}
		 */
		firmwareUploadHexStatus: function (compiled) {
			return compiled({
				dictionary:    App.getDictionaryPanel(),
				uploadedState: this.getEmptyHexStatus(),
			});
		}
	};


})();
Firmware.init();