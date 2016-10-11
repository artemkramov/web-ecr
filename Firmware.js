var Firmware = (function () {

	/**
	 * Form for uploading of the hex file
	 * @type {string}
	 */
	var formHexUpload = "#form-hex-upload";

	/**
	 * ID of the file
	 * @type {string}
	 */
	var fileHexUploadID = "file-hex";

	/**
	 * Array of promises for syncing of the data
	 * @type {Array}
	 */
	var promises = [];

	/**
	 * Content of the read file
	 * @type {string}
	 */
	var fileContent = "";

	/**
	 * Dictionary array
	 * @type {Array}
	 */
	var dictionary = [];

	/**
	 * Current language of the system
	 * @type {string}
	 */
	var currentLanguage = 'cs';

	/**
	 * Class of each template for underscore handling
	 * @type {string}
	 */
	var translatedBlock = '.language-template';

	/**
	 * Compressed byte array
	 * @type {Object}
	 */
	var currentBinaryData = {};

	return {
		/**
		 * Init events
		 */
		init:             function () {
			this.event();
		},
		/**
		 * Register events
		 */
		event:            function () {

			var self = this;

			$(document).ready(function () {

				self.initDictionary();

				$(document).on("change", "#file-hex", function() {
					fileContent  = "";
					currentBinaryData = {};
					var deferred = $.Deferred();
					promises.push(deferred);
					self.readFileData(deferred);
					$.when.apply($, promises).then(function () {
						self.parseHexFile(fileContent);
					});
				});

				$(document).on("submit", formHexUpload, function () {
					if (!_.isEmpty(currentBinaryData)) {
						var blob = new Blob(currentBinaryData.data, {
							type: "application/octet-stream"
						});
						var formData = new FormData();
						formData.append('file', blob);
						$.ajax({
							url: 'test.php',
							data: currentBinaryData.data,
							type: 'post',
							processData: false,
							contentType: 'application/octet-stream',
							success: function() {
								self.updateCurrentStatus(self.getCurrentStatus());
							}
						});
					}
					return false;
				});

			});
		},
		/**
		 * Read data from the file input to string
		 * @param deferred
		 */
		readFileData:     function (deferred) {
			var input = document.getElementById(fileHexUploadID);
			var file  = input.files[0];
			var fr    = new FileReader();
			fr.onload = function (event) {
				fileContent = event.target.result;
				deferred.resolve();
			};
			fr.readAsText(file);
		},
		/**
		 * Init all translations and views
		 */
		initDictionary:   function () {
			var self = this;
			$.getJSON("desc.json")
				.done(function (response) {
					if (_.has(response, currentLanguage)) {
						dictionary = response[currentLanguage];
						self.initTranslations();
					}
					else {
						console.log("Can't init language");
					}
				});
		},
		/**
		 * Parse HEX files
		 * @param fileData
		 */
		parseHexFile: function (fileData) {
			var response = {};
			var templates = {
				"VERS": "version",
				"GUID": "guid",
				"DESCR": "description"
			};
			var isHeaderParsed = false;
			var status = {};
			/**
			 * Split data by the end symbol
			 * @type {Array}
			 */
			var lines = fileData.split("\r\n");
			if (lines.length > 6) {
				/**
				 * Go through lines and check if the line is the status line
				 */
				for (var i = 0; i < lines.length; i++) {
					if (Object.keys(status).length == Object.keys(templates).length){
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
								line = line.replace(property, "").trim();
								status[templates[property]] = line;
							}

						}
					}
				}
			}
			if (!isHeaderParsed) {
				for (var property in templates) {
					status[templates[property]] = '-';
				}
			}
			else {
				/**
				 * Remove the header lines and the prelast checksum
				 */
				lines.splice(0, 3);
				lines = _.compact(lines);
				lines.splice(lines.length - 2, 1);
				currentBinaryData = IntelHex.parseIntelHex(lines.join("\r\n"));
			}
			this.updateUploadStatus(status);
		},
		/**
		 * Get translation from the dictionary
		 * @param key
		 * @param group
		 * @returns {*}
		 */
		getTranslation:   function (key, group) {
			if (typeof group == 'undefined') {
				group = 'panel';
			}
			return dictionary[group][key];
		},
		/**
		 * Init all views due to the current language
		 */
		initTranslations: function () {
			var self = this;
			$(translatedBlock).each(function () {
				var compiled = _.template($(this).html());
				var callback = self.camelize($(this).data('type'));
				var template = "";
				if (typeof self[callback] != 'undefined') {
					template = self[callback](compiled);
				}
				else {
					template = compiled({
						dictionary: dictionary.panel
					});
				}
				var block    = $("." + $(this).data('type')).html(template);
			});
		},
		getCurrentStatus: function () {
			return {
				version: '2.2.3',
				description: 'Test description' + Date.now(),
				guid: 'GUID type',
			};
		},
		updateCurrentStatus: function(state) {
			var blockTag = "firmware-current-state";
			var template = _.template($("[data-type=" + blockTag + "]").html());
			var block = "." + blockTag;
			$(block).html(template({
				dictionary: dictionary.panel,
				currentState: state
			}));
		},
		/**
		 * Update status parsed from the hex file
		 * @param state
		 */
		updateUploadStatus: function (state) {
			if (typeof state == 'undefined') {
				state = {};
			}
			var blockTag = "firmware-upload-hex-status";
			var template = _.template($("[data-type=" + blockTag + "]").html());
			var block = "." + blockTag;
			$(block).html(template({
				dictionary: dictionary.panel,
				uploadedState: state
			}));
			$(block).slideDown();

		},
		/**
		 * Camelize the string
		 * @param input
		 * @returns {string}
		 */
		camelize:         function (input) {
			return input.toLowerCase().replace(/-(.)/g, function(match, group1) {
				return group1.toUpperCase();
			});
		},
		/**
		 * Callback for the rendering of the current state view
		 * @param compiled
		 * @returns {*}
		 */
		firmwareCurrentState: function(compiled) {
			var currentState = {
				version: '2.2.3',
				description: 'Test description',
				guid: 'GUID type',
			};
			return compiled({
				dictionary: dictionary.panel,
				currentState: currentState,
			});
		},
		/**
		 * Callback for the rendering of the default state
		 * for the uploaded file
		 * @param compiled
		 * @returns {*}
		 */
		firmwareUploadHexStatus: function(compiled) {
			return compiled({
				dictionary: dictionary.panel,
				uploadedState: {},
			});
		}
	};


})();
Firmware.init();