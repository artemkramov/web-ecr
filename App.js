var App = (function () {

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

	return {
		/**
		 * Init all translations and views
		 */
		initDictionary:          function () {
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
		 * Init all views due to the current language
		 */
		initTranslations:        function () {
			var self = this;
			$(translatedBlock).each(function () {
				var compiled = _.template($(this).html());
				var callback = self.camelize($(this).data('type'));
				var template = "";
				if (typeof Firmware[callback] != 'undefined') {
					template = Firmware[callback](compiled);
				}
				else {
					template = compiled({
						dictionary: dictionary.panel
					});
				}
				$("." + $(this).data('type')).html(template);
			});
		},
		/**
		 * Get translation from the dictionary
		 * @param key
		 * @param group
		 * @returns {*}
		 */
		getTranslation:          function (key, group) {
			if (typeof group == 'undefined') {
				group = 'panel';
			}
			var message = dictionary[group][key];
			if (message) {
				return message;
			}
			return key;
		},
		/**
		 * Get all translations from the panel group
		 * @returns {*}
		 */
		getDictionaryPanel: function () {
			return dictionary.panel;
		},
		/**
		 * Camelize the string
		 * @param input
		 * @returns {string}
		 */
		camelize:                function (input) {
			return input.toLowerCase().replace(/-(.)/g, function (match, group1) {
				return group1.toUpperCase();
			});
		},
		/**
		 * Push alert message
		 * @param message
		 * @param type
		 */
		pushMessage:             function (message, type) {
			this.clearMessage();
			var n = noty({
				text: message,
				type: type
			});
		},
		/**
		 * Clear alert message
		 */
		clearMessage:            function () {
			$.noty.closeAll();
		},
		/**
		 * Push request result
		 * @param response
		 * @param successMessage
		 */
		pushResponse:            function (response, successMessage) {
			var message = successMessage;
			var type    = "success";
			if (!response.success) {
				type    = "error";
				message = response.error;
			}
			this.pushMessage(message, type);
		},
	};

})();