/* ===================================================
 * tagtacular.js v0.5.5
 * A jQuery library for tags management.
 *
 * http://gototech.com/tagtacular
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

"use strict";

(function($){

	$.fn.tagtacular = function(options) {

		var toplevel = this;
		var entityTags = [];
		var allTags = [];
		var mode = 'edit';
		var rememberTag = '';

		///////////////////////
		/// Core Functions ///
		/////////////////////

		var addTag = function(tag) {
			tag = $.trim(tag);
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
					settings.commitAddTag(tag, settings.entityId);
					drawTagList();
					drawEditTray();
					settings.messageAddTagSuccess && settings.flashSuccess(settings.messageAddTagSuccess, 'addTag', tag);
				} else {
					settings.messageAddTagAlreadyExists && settings.flashWarning(settings.messageAddTagAlreadyExists, 'addTag', tag);
				}
			} else {
				result && settings.flashFailure(result, 'addTag', tag);
			}
			toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').focus();
		}

	 	var drawEditTray = function() {
	 		if (mode == 'edit') {
	 			drawEditTrayForEditMode();
	 		} else if (mode == 'view') {
	 			drawEditTrayForViewMode();
	 		}	 		
	 		settings.postDrawEditTray(mode);
	 	}

		var drawEditTrayForEditMode = function() {
			var html = '<input class="tagtacular_add_input" value="'+rememberTag+'" />';
			if (settings.configShowAddButton) {
				html += settings.getAddButtonHtml(settings);
			}
			if (settings.configShowSwitchButton) {
				html += settings.getSwitchButtonHtml(mode, settings);
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
					drawEditTray();
					settings.postSwitchLayout(mode);
				});
			}

			toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').bind('keydown', function(e) {
				var tagText = toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').val();
				if ($.inArray(e.which, settings.configDeleteLastOnEmptyKeys) != -1 && tagText.length < 1) {
					e.preventDefault();
					removeTag(entityTags[entityTags.length - 1]);
				}
			});
			toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').bind('keypress', function(e) {
				if ($.inArray(e.which, settings.configDelimiters) != -1) {
					e.preventDefault();
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

			toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').focus();
		}

		var drawEditTrayForViewMode = function() {
			var html = '';
			if (settings.configShowSwitchButton && settings.configAllowedToEdit) {
				html += settings.getSwitchButtonHtml(mode, settings);
			}
			toplevel.find('.tagtacular_edit_tray').html(html);

			if (settings.configShowSwitchButton && settings.configAllowedToEdit) {
				toplevel.find('.tagtacular_edit_tray .tagtacular_switch_button').bind('click', function() {
					mode = 'edit';
					drawTagList();
					drawEditTray();
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
			drawEditTray();
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
			settings.commitRemoveTag(tag, settings.entityId);
	 		drawTagList();
	 		drawEditTray();
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
			alert(message);
		}

		var defaultFlashWarning = function(message) {
			alert(message);
		}

		var defaultFlashSuccess = function(message) {
			alert(message);
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
				return 'tag too short: minimum length is ' + settings.configMinimumTagLength;
			}
			if (tag.length > settings.configMaximumTagLength) {
				return 'tag too long: maximum length is ' + settings.configMaximumTagLength;
			}
			var pattern = /^[0-9A-Za-z_\- ]+$/;
			if (!pattern.test(tag)) {
				return 'illegal characters: tag names can only include letters, numbers, underscores, hyphens, and spaces';
			}

			return true;
		}

		var doNothing = function(param) {
			// do nothing
			return param;
		}

		// example
		var stricterValidate = function(tag, settings) {
			if (tag.length < settings.configMinimumTagLength) {
				return 'tag too short: minimum length is ' + settings.configMinimumTagLength;
			}
			if (tag.length > settings.configMaximumTagLength) {
				return 'tag too long: maximum length is ' + settings.configMaximumTagLength;
			}

			var pattern = /^[0-9A-Za-z_\-]+$/;
			if (!pattern.test(tag)) {
				return 'illegal characters: tag names can only include letters, numbers, underscores, and hyphens';
			}

			return true;
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
			configMinimumTagLength:        1,
			configMaximumTagLength:        32,
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
			flashWarning:                  defaultFlashWarning,
			flashSuccess:                  doNothing,
			messageAddTagSuccess:          'tag added',
			messageAddTagAlreadyExists:    'tag is already assigned',
			messageRemoveTagSuccess:       'tag removed',
			mode:                          'edit',
			postDrawEditTray:              doNothing,
			postDrawTagList:               doNothing,
			postSwitchLayout:              doNothing,
			sort:                          caseInsensitiveSort,
			systemTags:                    [],
			validate:                      defaultValidate
		};

		// initialization function
		var tagtacular = function(options) {
			options = options || {};
			$.each(options, function(key, value) {
				settings[key] = value;
			});

			entityTags = sortList(settings.entityTags);
			allTags = settings.sort($.unique(settings.systemTags.concat(entityTags)));
			mode = settings.mode;

			drawLayout();
			return toplevel;
		}

		$.extend(toplevel, {'addTag': addTag});
		$.extend(toplevel, {'getEntityId': function() {
			return settings.entityId;
		}});
		$.extend(toplevel, {'getEntityTags': function() { return entityTags; }});
		$.extend(toplevel, {'getRemainingTags': getRemainingTags});
		$.extend(toplevel, {'getState': getState});
		$.extend(toplevel, {'getSystemTags': function() { return allTags; } });
		$.extend(toplevel, {'removeTag': removeTag});
		$.extend(toplevel, {'tagtacular': tagtacular});

		return tagtacular(options);
	}

})(jQuery);
