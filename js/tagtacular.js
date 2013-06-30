/* ===================================================
 * tagtacular.js v0.7.1
 * A jQuery library for tags management.
 *
 * http://gototech.com/tagtacular
 * Docs: https://github.com/burnsbert/tagtacular/wiki
 * ===================================================
 * Copyright 2013 Eric W. Burns
 *
 * Licensed under the Mozilla Public License, Version 2.0 You may not use this work except in compliance with the License.
 *
 * http://www.mozilla.org/MPL/2.0/
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * See online documentation for complete instructions. Requires jquery.js and jqueryui.js.
 * =================================================== */

;(function($){

	$.fn.tagtacular = function(options) {

		var toplevel = this;
		var entityTags = [];
		var allTags = [];
		var mode = 'edit';
		var rememberTag = '';
		var flashCount = 0;

		///////////////////////
		/// Core Functions ///
		/////////////////////

		var addTag = function(tag) {
			tag = settings.formatTagName($.trim(tag));
			var result = settings.validate(tag, settings);
			if (result === true) {
				if (!entityHasTag(tag)) {
					entityTags.push(tag);
					if (!tagInList(tag, allTags)) {
						allTags.push(tag);
						allTags = settings.sort(allTags);
					}
					if (settings.configSortTags) {
						entityTags = settings.sort(entityTags);
					}
					settings.commitAddTag(tag, settings.entityId, settings);
					drawTagList();
					drawEditTray(true);
					settings.messageAddTagSuccess && settings.flashSuccess(settings.messageAddTagSuccess);
				} else {
					settings.messageAddTagAlreadyExists && settings.flashFailure(settings.messageAddTagAlreadyExists);
				}
			} else {
				result && settings.flashFailure(result);
			}
			toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').focus();
		}

	 	var drawEditTray = function(focus) {
	 		if (mode == 'edit') {
	 			drawEditTrayForEditMode(focus);
	 		} else if (mode == 'view') {
	 			drawEditTrayForViewMode();
	 		}	 		
	 		settings.postDrawEditTray(mode);
	 	}

		var drawEditTrayForEditMode = function(focus) {
			var html = '<input class="tagtacular_add_input" value="'+rememberTag+'" />';
			if (settings.configShowAddButton) {
				html += settings.getAddButtonHtml(settings);
			}
			if (settings.configShowSwitchButton) {
				html += settings.getSwitchButtonHtml(mode, settings);
			}
			if (settings.configRenderFlashMessageSpan) {
				html += '<span style="display: none;" class="tagtacular_flash"></span>';
			}
			toplevel.find('.tagtacular_edit_tray').html(html);
			if (settings.configShowAddButton) {
				toplevel.find('.tagtacular_edit_tray .tagtacular_add_button').bind('click', function() {
					var tagText = toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').val();
					addTag(tagText);
				});
			}

			if (settings.configShowSwitchButton) {
				toplevel.find('.tagtacular_edit_tray .tagtacular_switch_button').bind('click', function() {
					var tagText = toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').val();
					if (settings.configAddOnSwitch && tagText.length >= 1) {
						addTag(tagText);
					}
					rememberTag = toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').val();
					mode = 'view';
					drawTagList();
					drawEditTray(true);
					settings.postSwitchLayout(mode);
				});
			}

			toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').bind('keydown', function(e) {
				var tagText = toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').val();
				if ($.inArray(e.which, settings.configDeleteLastOnEmptyKeys) != -1 && tagText.length < 1) {
					e.preventDefault();
					e.stopPropagation();
					removeTag(entityTags[entityTags.length - 1]);
				}
			});

			toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').bind('keypress', function(e) {
				if ($.inArray(e.which, settings.configDelimiters) != -1) {
					e.preventDefault();
					e.stopPropagation();
					var tagText = toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').val();
					if (tagText.length > 0) {
						addTag(tagText);
					}
				}
			});

			if (settings.configAutocomplete) {
				toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').autocomplete({
					source: getAutocompleteTags(),
					select: function(e, ui) {
						toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').val('');
						addTag(ui.item.value);
					}
				});
			}

			if (focus) {
				toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').focus();
			}
		}

		var drawEditTrayForViewMode = function() {
			var html = '';
			if (settings.configShowSwitchButton && settings.configAllowedToEdit) {
				html += settings.getSwitchButtonHtml(mode, settings);
			}
			if (settings.configRenderFlashMessageSpan) {
				html += '<span style="display: none;" class="tagtacular_flash"></span>';
			}

			toplevel.find('.tagtacular_edit_tray').html(html);

			if (settings.configShowSwitchButton && settings.configAllowedToEdit) {
				toplevel.find('.tagtacular_edit_tray .tagtacular_switch_button').bind('click', function() {
					mode = 'edit';
					drawTagList();
					drawEditTray(true);
					rememberTag = '';
					settings.postSwitchLayout(mode);
				});
			}
		}

		var drawLayout = function() {
			if (!settings.configAllowedToEdit) {
				mode = 'view';
			}
			toplevel.html(settings.getLayoutHtml());
			drawTagList();
			drawEditTray(false);
		}

	 	var drawTagList = function() {
			entityTags = sortList(entityTags);

	 		if (mode == 'edit') {
	 			drawTagListForEditMode();
	 		} else if (mode == 'view') {
	 			drawTagListForViewMode();
	 		}
	 		settings.postDrawTagList(mode);
	 	}

		var drawTagListForEditMode = function() {
			var tags = [];
			$.each(entityTags, function(key, value) {
				tags.push(settings.getTagHtml(value, mode, settings));
			});
			var html = tags.join('');
			toplevel.find('.tagtacular_tag_tray').html(html);
			toplevel.find('.tagtacular_tag_tray .tagtacular_tag').last().find('.tagtacular_delim').remove();

			toplevel.find('.tagtacular_tag_tray .tagtacular_delete').bind('click', function(e) {
				e.preventDefault();
				var tag = $(this).closest('.tagtacular_tag');
				var tagText = tag.find('.tagtacular_value').text();
				tag.remove()
				removeTag(tagText);
			});
		}

		var drawTagListForViewMode = function() {
			var tags = [];
			$.each(entityTags, function(key, value) {
				tags.push(settings.getTagHtml(value, mode, settings));
			});
			var html = tags.join('');
			toplevel.find('.tagtacular_tag_tray').html(html);
			toplevel.find('.tagtacular_tag_tray .tagtacular_tag').last().find('.tagtacular_delim').remove();
		}

		var entityHasTag = function(tag) {
			return tagInList(tag, entityTags);
		}

		var getAutocompleteTags = function() {
			if (settings.configAutocompletePrune) {
				return getRemainingTags();
			} else {
				return allTags;
			}
		}

		var getRemainingTags = function() {
			var diff = $.grep(allTags,function(val) {return $.inArray(val, entityTags) < 0});
			return diff;
		}

		var getState = function() {
			var state = $.extend({}, settings);
			state.entityTags = entityTags;
			state.systemTags = allTags;
			state.mode = mode;
			state.toplevel = toplevel;
			return state;
		}

		var removeTag = function(tag) {
			entityTags = $.grep(entityTags, function(value) {
				if (settings.configCaseInsensitive) {
					return value.toUpperCase() != tag.toUpperCase();
				} else {
					return value != tag;
				}
			});
			settings.commitRemoveTag(tag, settings.entityId, settings);
	 		drawTagList();
	 		drawEditTray(true);
			settings.messageRemoveTagSuccess && settings.flashSuccess(settings.messageRemoveTagSuccess, 'removeTag', tag);	 		
			toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').focus();
	 	}

	 	var sortList = function(list) {
	 		if (settings.configSortTags) {
	 			list = settings.sort(list);
	 		}
	 		return list;
	 	}

		var systemHasTag = function(tag) {
			return tagInList(tag, systemTags);
		}

		var tagInList = function(tag, list) {
			var match = $.grep(list, function(value) {
				if (settings.configCaseInsensitive) {
					return value.toUpperCase() == tag.toUpperCase();
				} else {
					return value == tag;
				}
			});
			return match.length > 0;
		}

		//////////////////////////
		/// Default Functions ///
		////////////////////////

		// default
		var caseInsensitiveSort = function(list) {
			list.sort(function(a,b) {
				var a = a.toLowerCase();
				var b = b.toLowerCase();
				if (a == b) {
					return 0;
				}
				if (a > b) {
					return 1;
				}
				return -1;
			});

			return list;	
		}

		// example
		var caseSensitiveSort = function(list) {
			list.sort(function(a,b) {
				if (a == b) {
					 return 0;
				}
				if (a > b) {
					return 1;
				}
				return -1;
			});

			return list;	
		}

		var defaultFlashFailure = function(message) {
			var flash = toplevel.find('.tagtacular_flash');
			flash.html(message);
			flash.addClass('tagtacular_failure');
			flash.removeClass('tagtacular_success');
			flash.show();

			// if the are several messages in a row, the last one should get its full allotment of time
			var expected = ++flashCount;

			if (settings.configFlashFailureHideAfter) {
				setTimeout(function() {
					if (flashCount == expected) {
						var flash = toplevel.find('.tagtacular_flash');
						flash.fadeOut();
					}
				}, 1000 * settings.configFlashFailureHideAfter);
			}
		}

		var defaultFlashSuccess = function(message) {
			var flash = toplevel.find('.tagtacular_flash')
			flash.html(message);
			flash.addClass('tagtacular_success');
			flash.removeClass('tagtacular_failure');
			flash.show();

			// if the are several messages in a row, the last one should get its full allotment of time
			var expected = ++flashCount;

			if (settings.configFlashSuccessHideAfter) {
				setTimeout(function() {
					if (flashCount == expected) {
						var flash = toplevel.find('.tagtacular_flash');
						flash.fadeOut();
					}
				}, 1000 * settings.configFlashSuccessHideAfter);

			}
		}

		var defaultGetAddButtonHtml = function(settings) {
			return '<button class="tagtacular_add_button">'+settings.configAddButtonText+'</button>';;
		}

		var defaultGetLayoutHtml = function() {
			return '<div class="tagtacular_tag_tray"></div><div class="tagtacular_edit_tray"></div>';
		}

		var defaultGetSwitchButtonHtml = function(mode, settings) {
			var label = (mode == 'view') ? settings.configSwitchButtonTextInView : settings.configSwitchButtonTextInEdit;
			return '<button class="tagtacular_switch_button">'+label+'</button>';
		}

		var defaultGetTagHtml = function(tag, mode, settings) {
			if (mode=='edit') {
				return '<span class="tagtacular_tag"><span class="tagtacular_value">'+tag+'</span>&nbsp;<a class="tagtacular_delete" href="#">'+settings.configDeleteSymbol+'</a><span class="tagtacular_delim">'+settings.configTagSeparator+'</span></span>';
			} else if (mode=='view') {
				return '<span class="tagtacular_tag"><span class="tagtacular_value">'+tag+'</span><span class="tagtacular_delim">'+settings.configTagSeparator+'</span></span>';
			}
		}

		var defaultValidate = function(tag, settings) {
			if (tag.length < settings.configMinimumTagLength) {
				return settings.messageTagTooShort;
			}
			if (tag.length > settings.configMaximumTagLength) {
				return settings.messageTagTooLong;
			}
			var pattern = settings.validationPattern;
			if (!pattern.test(tag)) {
				return settings.messageTagNameInvalid;
			}

			return true;
		}

		var doNothing = function(param) {
			// do nothing
			return param;
		}

		///////////////////////////////////
		/// Setting and Initialization ///
		/////////////////////////////////

		var settings = {
			commitAddTag:                  doNothing,
			commitRemoveTag:               doNothing,
			configAddOnSwitch:             true,
			configAddButtonText:           'Add',
			configAllowedToEdit:           true,
			configAutocomplete:            true,
			configAutocompletePrune:       true,
			configCaseInsensitive:         true,
			configDeleteSymbol:            'X',
			configDeleteLastOnEmptyKeys:   [],
			configDelimiters:              [13,44],
			configFlashFailureHideAfter:   5,
			configFlashSuccessHideAfter:   5,
			configFormatTagNamesOnInit:    false,
			configMinimumTagLength:        1,
			configMaximumTagLength:        32,
			configRenderFlashMessageSpan:  true, //new
			configShowAddButton:           true,
			configShowSwitchButton:        true,
			configSortTags:                true,
			configSwitchButtonTextInEdit:  'Done',
			configSwitchButtonTextInView:  'Edit',
			configTagSeparator:            '',
			entityId:                      null,
			entityTags:                    [],
			getAddButtonHtml:              defaultGetAddButtonHtml, 
			getLayoutHtml:                 defaultGetLayoutHtml,
			getSwitchButtonHtml:           defaultGetSwitchButtonHtml, 
			getTagHtml:                    defaultGetTagHtml,
			flashFailure:                  defaultFlashFailure,
			flashSuccess:                  defaultFlashSuccess,
			formatTagName:                 doNothing,
			messageAddTagSuccess:          'tag added',
			messageAddTagAlreadyExists:    'tag is already assigned',
			messageRemoveTagSuccess:       'tag removed',
			messageTagNameInvalid:         'invalid tag name: tag names can only include letters, numbers, underscores, hyphens, and spaces',
			messageTagTooLong:             'tag name too long, maximum length of [configMaximumTagLength]',
			messageTagTooShort:            'tag name too short, minimum length of [configMinimumTagLength]',
			mode:                          'edit',
			postDrawEditTray:              doNothing,
			postDrawTagList:               doNothing,
			postSwitchLayout:              doNothing,
			sort:                          caseInsensitiveSort,
			systemTags:                    [],
			validate:                      defaultValidate,
			validationPattern:             /^[0-9A-Za-z_\- ]+$/
		};

		// initialization function
		var tagtacular = function(options) {
			options = options || {};
			$.each(options, function(key, value) {
				settings[key] = value;
			});

			settings.messageTagTooLong = settings.messageTagTooLong.replace('[configMaximumTagLength]', settings.configMaximumTagLength);
			settings.messageTagTooShort = settings.messageTagTooShort.replace('[configMinimumTagLength]', settings.configMinimumTagLength);

			entityTags = sortList(settings.entityTags);
			allTags = settings.sort($.unique(settings.systemTags.concat(entityTags)));

			if (settings.configFormatTagNamesOnInit) {
				entityTags = $.map(entityTags, function(value, index) {
					return settings.formatTagName(value);
				});
				allTags = $.map(allTags, function(value, index) {
					return settings.formatTagName(value);
				});
			}

			mode = settings.mode;

			drawLayout();
			return toplevel;
		}

		$.extend(toplevel, {'addTag': addTag});
		$.extend(toplevel, {'flashFailure': settings.flashFailure}); // new
		$.extend(toplevel, {'flashSuccess': settings.flashSuccess}); // new
		$.extend(toplevel, {'getEntityId': function() {
			return settings.entityId;
		}});
		$.extend(toplevel, {'getEntityTags': function() { 
			return entityTags; 
		}});
		$.extend(toplevel, {'getRemainingTags': getRemainingTags});
		$.extend(toplevel, {'getState': getState});
		$.extend(toplevel, {'getSystemTags': function() { 
			return allTags; 
		}});
		$.extend(toplevel, {'removeTag': removeTag});
		$.extend(toplevel, {'tagtacular': tagtacular});

		return tagtacular(options);
	}

})(jQuery);
