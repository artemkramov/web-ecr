/**
 * Api object for the speaking with the device
 * @type {{getInfo, uploadFirmwareInfo, uploadHexFile, burnProcessor, checkResponseForError, checkResponseArray}}
 */
var Api = (function () {

	/**
	 * Constant which shows that there's no error on response
	 * @type {number}
	 */
	const STATUS_NO_ERROR = 0;

	return {
		/**
		 * Get current firmware info about the device
		 * @returns {{}}
		 */
		getInfo:            function () {
			var status = {};
			var xhr    = $.ajax({
				url:     '/cgi/fw_inf',
				type:    'get',
				async:   false,
				success: function (response) {
					status = {
						version:     response.fw_version,
						description: response.fw_descr,
						guid:        response.fw_guid
					};
				}
			});
			return status;
		},
		/**
		 * Update firmware information
		 * @param status
		 * @returns {*}
		 */
		uploadFirmwareInfo: function (status) {
			if (!_.isEmpty(status)) {
				var data = {
					fw_guid:    status.guid,
					fw_version: status.version,
					fw_desc:    status.description
				};
				return $.ajax({
					url:     '/cgi/fw_inf',
					type:    'post',
					data:    status,
					success: function (response) {

					}
				})
			}
			return false;
		},
		/**
		 * Upload binary data (converted HEX-file) to the device
		 * @param binaryData
		 * @returns {*}
		 */
		uploadHexFile:      function (binaryData) {
			if (!_.isEmpty(binaryData)) {
				return $.ajax({
					url:         '/cgi/fw_upload',
					data:        binaryData,
					type:        'post',
					processData: false,
					contentType: 'application/octet-stream',
				});
			}
			return false;
		},
		/**
		 * Burn hex data from the device to the processor
		 * @param callback
		 */
		burnProcessor: function (callback) {
			$.ajax({
				url: '/cgi/fw_burn',
				type: 'post',
				success: function (ajaxResponse) {
					callback(ajaxResponse);
				}
			});
		},
		/**
		 * Check if the response contains any error
		 * @param response
		 * @returns {Object}
		 */
		checkResponseForError: function(response) {
			var errorFields = ['fw_info_error', 'fw_upload_error', 'fw_burn_error'];
			var result = {
				success: true,
				error: false,
			};
			errorFields.forEach(function(property, i, arr) {
				/**
				 * If the field is in response fields
				 * then check it. If the response isn't OK
				 * then save the error to display
				 */
				if (_.has(response, property)) {
					if (response[property] !== STATUS_NO_ERROR) {
						result.success = false;
						result.error = response[property];
					}
				}
			});
			return result;
		},
		/**
		 * Check the array of response for any error
		 * @param responses
		 * @returns {{success: boolean, error: boolean}}
		 */
		checkResponseArray: function(responses) {
			var result = {
				success: true,
				error: false
			};
			var errors = [];
			var self = this;
			responses.forEach(function(response) {
				var currentResult = self.checkResponseForError(response);
				if (currentResult.success == false) {
					errors.push(currentResult.error);
				}
			});
			/**
			 * If we have any error then join it via <br/> tag
			 */
			if (!_.isEmpty(errors)) {
				result.success = false;
				result.error = errors.join("<br/>");
			}
			return result;
		}
	};
})();