(function (window, $) {
  "use strict";

  if (!$) {
    throw new Error("icon_picker_bs_3 requires jQuery.");
  }

  var INSTANCE_COUNTER = 0;

  var DEFAULT_MATERIAL_ICONS = [];
  var DEFAULT_LINE_AWESOME_ICONS = [];

  var BOOTSTRAP_ADAPTERS = {
    3: {
      dismissAttr: "data-dismiss",
      hiddenEvent: "hidden.bs.modal",
      renderCloseButton: function () {
        return '' +
          '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
          '<span aria-hidden="true">&times;</span>' +
          "</button>";
      },
      showModal: function ($modal) {
        $modal.modal("show");
      },
      hideModal: function ($modal) {
        $modal.modal("hide");
      }
    },
    5: {
      dismissAttr: "data-bs-dismiss",
      hiddenEvent: "hidden.bs.modal",
      renderCloseButton: function () {
        return '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>';
      },
      showModal: function ($modal) {
        if (window.bootstrap && window.bootstrap.Modal) {
          window.bootstrap.Modal.getOrCreateInstance($modal[0]).show();
        } else {
          $modal.modal("show");
        }
      },
      hideModal: function ($modal) {
        if (window.bootstrap && window.bootstrap.Modal) {
          window.bootstrap.Modal.getOrCreateInstance($modal[0]).hide();
        } else {
          $modal.modal("hide");
        }
      }
    }
  };

  var MATERIAL_SYMBOLS_PROVIDER = {
    id: "material-symbols",
    iconClass: "material-symbols-rounded",
    icons: DEFAULT_MATERIAL_ICONS,
    renderIcon: function (iconName, extraClass) {
      return '<span class="' + this.iconClass + " " + (extraClass || "") + '">' + iconName + "</span>";
    },
    formatValue: function (iconName) {
      return iconName ? this.iconClass + " " + iconName : "";
    },
    parseValue: function (value) {
      if (!value) {
        return "";
      }

      var cleaned = String(value).trim();
      if (cleaned.indexOf(this.iconClass) === 0) {
        return cleaned.slice(this.iconClass.length).trim();
      }

      return cleaned;
    }
  };

  var LINE_AWESOME_PROVIDER = {
    id: "line-awesome",
    iconClass: "la",
    iconPrefix: "la-",
    icons: DEFAULT_LINE_AWESOME_ICONS,
    renderIcon: function (iconName, extraClass) {
      return '<i class="' + this.iconClass + " " + this.iconPrefix + iconName + " " + (extraClass || "") + '"></i>';
    },
    formatValue: function (iconName) {
      return iconName ? this.iconClass + " " + this.iconPrefix + iconName : "";
    },
    parseValue: function (value) {
      if (!value) {
        return "";
      }

      var cleaned = String(value).trim();
      var parts = cleaned.split(/\s+/);
      var iconPart = "";

      $.each(parts, function (_, token) {
        if (token.indexOf("la-") === 0) {
          iconPart = token.replace(/^la-/, "");
          return false;
        }
      });

      return iconPart || cleaned;
    }
  };

  var FALLBACK_LOCALE = {
    modalTitle: "Select icon",
    searchPlaceholder: "Search icon...",
    closeButton: "Close",
    noResults: "No results.",
    categoryLabels: {}
  };

  function IconPicker(element, options) {
    this.$root = $(element);
    this.instanceId = ++INSTANCE_COUNTER;
    this.pluginName = "icon_picker_bs_3";

    var dataOptions = this.$root.data() || {};
    var mergedOptions = $.extend(true, {}, $.fn.icon_picker_bs_3.defaults, options, dataOptions);

    this.options = mergedOptions;
    this.adapter = BOOTSTRAP_ADAPTERS[this.options.bootstrapVersion] || BOOTSTRAP_ADAPTERS[3];
    this.locale = resolveLocale(this.options.lang, this.options.locale);
    this.iconProvider = createProvider(this.options.iconProvider || LINE_AWESOME_PROVIDER, this.options.icons);
    this.categories = normalizeCategories(this.options.categories, this.iconProvider.icons);
    this.iconProvider.icons = dedupeIcons(
      [].concat.apply([], $.map(this.categories, function (cat) { return cat.icons; }))
    );
    this.selectedIcon = "";
    this.$modal = null;

    this.build();
    this.bindEvents();
    this.setInitialValue();
  }

  function createProvider(baseProvider, icons) {
    var provider = $.extend({}, baseProvider);
    var sourceIcons = $.isArray(icons) ? icons : baseProvider.icons;
    provider.icons = $.isArray(sourceIcons) ? sourceIcons.slice() : [];
    return provider;
  }

  function resolveLocale(lang, inlineLocale) {
    var registry = window.IconPickerLocales || {};
    var langKey = String(lang || "").toLowerCase();
    var fromRegistry = registry[langKey] || registry["en-us"] || {};
    return $.extend(true, {}, FALLBACK_LOCALE, fromRegistry, inlineLocale || {});
  }

  function normalizeCategories(categories, icons) {
    if ($.isArray(categories) && categories.length) {
      return $.map(categories, function (category, idx) {
        var label = category.name || category.label || ("Category " + (idx + 1));
        return {
          id: category.id || slugify(label),
          name: label,
          icons: $.isArray(category.icons) ? dedupeIcons(category.icons) : []
        };
      });
    }

    return [{
      id: "all",
      name: "All",
      icons: dedupeIcons($.isArray(icons) ? icons : [])
    }];
  }

  function dedupeIcons(icons) {
    var out = [];
    var seen = {};

    $.each(icons, function (_, iconName) {
      var key = String(iconName || "").trim();
      if (!key || seen[key]) {
        return;
      }
      seen[key] = true;
      out.push(key);
    });

    return out;
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  IconPicker.prototype.build = function () {
    this.$root.addClass("ip-icon-picker");

    this.isStandaloneButton = this.options.buttonOnly || !this.options.showInput;
    this.$trigger = $('<button type="button" class="btn btn-default ip-trigger-btn"></button>');
    this.$preview = $('<span class="ip-icon-preview"></span>');
    this.$hiddenInput = $('<input type="hidden" class="ip-hidden-input">');
    this.$textInput = $();

    if (this.options.inputName) {
      this.$hiddenInput.attr("name", this.options.inputName);
    }

    this.$trigger.append(this.$preview);
    this.$trigger.attr("title", this.locale.modalTitle);

    if (this.isStandaloneButton) {
      this.$group = $('<div class="ip-standalone"></div>');
      this.$group.append(this.$trigger);
      this.$group.append(this.$hiddenInput);
      this.$root.empty().append(this.$group);
      return;
    }

    this.$group = $('<div class="input-group ip-input-group"></div>');
    this.$btnWrap = $('<span class="input-group-btn"></span>');
    this.$btnWrap.append(this.$trigger);
    this.$group.append(this.$btnWrap);

    this.$textInput = $('<input type="text" class="form-control ip-value-input" readonly>');
    this.$textInput.attr("placeholder", this.options.placeholder || "");
    this.$group.append(this.$textInput);

    this.$group.append(this.$hiddenInput);
    this.$root.empty().append(this.$group);
  };

  IconPicker.prototype.bindEvents = function () {
    var self = this;

    this.$trigger.on("click", function (event) {
      event.preventDefault();
      self.openModal();
    });
  };

  IconPicker.prototype.setInitialValue = function () {
    var value = this.options.selectedIcon || "";
    var hiddenValue = this.$root.attr("data-value");

    if (hiddenValue) {
      value = hiddenValue;
    }

    var parsedIcon = this.iconProvider.parseValue(value);
    if (!parsedIcon && this.iconProvider.icons.length) {
      parsedIcon = this.iconProvider.icons[0];
    }

    this.setIcon(parsedIcon, false);
  };

  IconPicker.prototype.ensureModal = function () {
    if (this.$modal) {
      return;
    }

    var modalId = "ip-modal-" + this.instanceId;
    var title = this.options.modalTitle || this.locale.modalTitle;
    var dismiss = this.adapter.dismissAttr;
    var closeButtonHtml = this.adapter.renderCloseButton();

    var modalHtml = '' +
      '<div class="modal fade ip-modal" tabindex="-1" role="dialog" id="' + modalId + '">' +
      '<div class="modal-dialog modal-md" role="document">' +
      '<div class="modal-content">' +
      '<div class="modal-header">' +
      closeButtonHtml +
      '<h4 class="modal-title">' + title + "</h4>" +
      "</div>" +
      '<div class="modal-body">' +
      (this.options.enableSearch
        ? '<div class="ip-search-wrap"><input type="text" class="form-control ip-search" placeholder="' + (this.options.searchPlaceholder || this.locale.searchPlaceholder) + '"></div>'
        : "") +
      '<div class="ip-accordion"></div>' +
      '<div class="ip-empty">' + this.locale.noResults + "</div>" +
      "</div>" +
      '<div class="modal-footer">' +
      '<button type="button" class="btn btn-default" ' + dismiss + '="modal">' + this.locale.closeButton + "</button>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>";

    this.$modal = $(modalHtml);
    $("body").append(this.$modal);

    this.$accordion = this.$modal.find(".ip-accordion");
    this.$empty = this.$modal.find(".ip-empty");
    this.$search = this.$modal.find(".ip-search");

    this.renderCategories();
    this.bindModalEvents();
  };

  IconPicker.prototype.bindModalEvents = function () {
    var self = this;

    this.$modal.on("click", ".ip-grid-item", function () {
      var iconName = $(this).attr("data-icon");
      self.setIcon(iconName, true);
      self.adapter.hideModal(self.$modal);
    });

    this.$modal.on("click", ".ip-acc-toggle", function () {
      var $section = $(this).closest(".ip-acc-section");
      var $body = $section.find(".ip-acc-body");
      var isOpen = $section.hasClass("is-open");

      if (isOpen) {
        return;
      }

      self.$accordion.find(".ip-acc-section.is-open").not($section).each(function () {
        var $openSection = $(this);
        $openSection.removeClass("is-open");
        $openSection.find(".ip-acc-body").stop(true, true).slideUp(180);
      });

      $section.addClass("is-open");
      $body.stop(true, true).slideDown(180);
    });

    if (this.options.enableSearch && this.$search.length) {
      this.$search.on("input", function () {
        var phrase = String($(this).val() || "").toLowerCase();
        self.filterCategories(phrase);
      });
    }

    this.$modal.on(this.adapter.hiddenEvent, function () {
      if (self.$search && self.$search.length) {
        self.$search.val("");
      }
      self.renderCategories();
    });
  };

  IconPicker.prototype.renderCategories = function () {
    var self = this;
    this.$accordion.empty();

    if (!this.categories.length) {
      this.$empty.addClass("is-visible");
      return;
    }

    this.$empty.removeClass("is-visible");

    $.each(this.categories, function (idx, category) {
      var categoryLabel = self.locale.categoryLabels[category.id] || category.name;
      var $section = $(
        '<div class="ip-acc-section" data-category-id="' + category.id + '">' +
          '<button type="button" class="ip-acc-toggle">' +
            '<span class="ip-acc-title"></span>' +
            '<span class="ip-acc-count"></span>' +
          "</button>" +
          '<div class="ip-acc-body"><div class="ip-grid"></div></div>' +
        "</div>"
      );

      $section.find(".ip-acc-title").text(categoryLabel);
      $section.find(".ip-acc-count").text(category.icons.length);
      self.$accordion.append($section);

      self.renderCategoryGrid($section.find(".ip-grid"), category.icons);
    });
  };

  IconPicker.prototype.renderCategoryGrid = function ($grid, icons) {
    var self = this;
    $grid.empty();

    $.each(icons, function (_, iconName) {
      var selectedClass = iconName === self.selectedIcon ? " is-selected" : "";
      var iconHtml = self.iconProvider.renderIcon(iconName, "ip-grid-icon");
      var $item = $(
        '<button type="button" class="ip-grid-item' + selectedClass + '" data-icon="' + iconName + '" title="' + iconName + '">' +
        iconHtml +
        "</button>"
      );
      $grid.append($item);
    });
  };

  IconPicker.prototype.filterCategories = function (phrase) {
    var visibleAny = false;
    var selected = this.selectedIcon;

    this.$accordion.find(".ip-acc-section").each(function () {
      var $section = $(this);
      var visibleCount = 0;

      $section.find(".ip-grid-item").each(function () {
        var $item = $(this);
        var iconName = String($item.attr("data-icon") || "").toLowerCase();
        var matches = !phrase || iconName.indexOf(phrase) !== -1;
        $item.toggle(matches);
        if (matches) {
          visibleCount += 1;
        }
      });

      $section.find(".ip-acc-count").text(visibleCount);
      $section.toggleClass("is-filtered-out", visibleCount === 0);
      $section.toggle(visibleCount > 0);

      if (visibleCount > 0) {
        visibleAny = true;
      }

      if (phrase && visibleCount > 0) {
        $section.addClass("is-open");
        $section.find(".ip-acc-body").show();
      } else if (phrase && visibleCount === 0) {
        $section.removeClass("is-open");
        $section.find(".ip-acc-body").hide();
      }
    });

    this.$empty.toggleClass("is-visible", !visibleAny);

    if (selected) {
      this.$accordion.find('.ip-grid-item[data-icon="' + selected + '"]').addClass("is-selected");
    }
  };

  IconPicker.prototype.renderPreview = function () {
    this.$preview.html(this.iconProvider.renderIcon(this.selectedIcon, ""));
  };

  IconPicker.prototype.setIcon = function (iconName, triggerChange) {
    this.selectedIcon = iconName || "";
    var formatted = this.iconProvider.formatValue(this.selectedIcon);

    this.renderPreview();
    this.$hiddenInput.val(formatted);

    if (this.options.showInput && this.$textInput.length) {
      this.$textInput.val(formatted);
    }

    if (this.$modal) {
      this.$modal.find(".ip-grid-item").removeClass("is-selected");
      this.$modal.find('.ip-grid-item[data-icon="' + this.selectedIcon + '"]').addClass("is-selected");
    }

    if (triggerChange) {
      this.$root.trigger("iconpicker:change", {
        icon: this.selectedIcon,
        value: formatted,
        instance: this
      });
    }
  };

  IconPicker.prototype.getValue = function () {
    return this.$hiddenInput.val();
  };

  IconPicker.prototype.getIcon = function () {
    return this.selectedIcon;
  };

  IconPicker.prototype.setIcons = function (icons) {
    if (!$.isArray(icons)) {
      return;
    }

    this.iconProvider.icons = dedupeIcons(icons);
    this.categories = normalizeCategories(null, this.iconProvider.icons);

    if (!this.selectedIcon && this.iconProvider.icons.length) {
      this.setIcon(this.iconProvider.icons[0], false);
    } else if (this.selectedIcon && this.iconProvider.icons.indexOf(this.selectedIcon) === -1) {
      this.setIcon(this.iconProvider.icons[0] || "", false);
    }

    if (this.$modal) {
      this.renderCategories();
    }
  };

  IconPicker.prototype.setCategories = function (categories) {
    this.categories = normalizeCategories(categories, this.iconProvider.icons);
    this.iconProvider.icons = dedupeIcons(
      [].concat.apply([], $.map(this.categories, function (cat) { return cat.icons; }))
    );

    if (!this.selectedIcon && this.iconProvider.icons.length) {
      this.setIcon(this.iconProvider.icons[0], false);
    } else if (this.selectedIcon && this.iconProvider.icons.indexOf(this.selectedIcon) === -1) {
      this.setIcon(this.iconProvider.icons[0] || "", false);
    }

    if (this.$modal) {
      this.renderCategories();
    }
  };

  IconPicker.prototype.openModal = function () {
    this.ensureModal();
    this.renderCategories();
    this.adapter.showModal(this.$modal);
  };

  IconPicker.prototype.destroy = function () {
    this.$trigger.off("click");
    if (this.$modal) {
      this.$modal.remove();
      this.$modal = null;
    }
    this.$root.removeData(this.pluginName);
    this.$root.empty();
  };

  $.fn.icon_picker_bs_3 = function (optionOrMethod) {
    var args = Array.prototype.slice.call(arguments, 1);

    if (typeof optionOrMethod === "string") {
      var methodName = optionOrMethod;
      var firstResult;

      this.each(function () {
        var instance = $(this).data("icon_picker_bs_3");
        if (!instance || typeof instance[methodName] !== "function") {
          return;
        }
        var result = instance[methodName].apply(instance, args);
        if (typeof firstResult === "undefined" && typeof result !== "undefined") {
          firstResult = result;
        }
      });

      return typeof firstResult === "undefined" ? this : firstResult;
    }

    return this.each(function () {
      var $element = $(this);
      var instance = $element.data("icon_picker_bs_3");
      if (!instance) {
        instance = new IconPicker(this, optionOrMethod || {});
        $element.data("icon_picker_bs_3", instance);
      }
    });
  };

  $.fn.icon_picker_bs_3.defaults = {
    bootstrapVersion: 3,
    lang: "en-us",
    locale: null,
    showInput: true,
    buttonOnly: false,
    inputName: "icon_class",
    selectedIcon: "",
    placeholder: "Select icon",
    modalTitle: "",
    enableSearch: true,
    searchPlaceholder: "",
    icons: null,
    categories: null,
    accordionMode: "single",
    iconProvider: LINE_AWESOME_PROVIDER
  };

  window.IconPickerBs3Defaults = $.fn.icon_picker_bs_3.defaults;
  window.IconPickerBs3Providers = {
    materialSymbols: MATERIAL_SYMBOLS_PROVIDER,
    lineAwesome: LINE_AWESOME_PROVIDER
  };

  // Backward compatibility aliases.
  $.fn.iconPicker = $.fn.icon_picker_bs_3;
  $.fn.iconPicker.defaults = $.fn.icon_picker_bs_3.defaults;
  window.IconPickerDefaults = window.IconPickerBs3Defaults;
  window.IconPickerProviders = window.IconPickerBs3Providers;
})(window, window.jQuery);
