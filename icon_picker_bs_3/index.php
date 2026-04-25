<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Icon Picker Demo (Bootstrap 3 + Line Awesome)</title>

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/line-awesome/1.3.0/line-awesome/css/line-awesome.min.css">
  <link rel="stylesheet" href="./icon-picker.css">
</head>
<body>
  <div class="container" style="margin-top: 40px;">
    <h3>Icon Picker - Bootstrap 3 + Line Awesome</h3>
    <p class="text-muted">Pelny zestaw ikon i podzial na kategorie (accordion).</p>

    <div class="row">
      <div class="col-sm-6">
        <label for="picker-a">Icon class (input visible, lang: pl-pl)</label>
        <div id="picker-a"></div>
      </div>
      <div class="col-sm-6">
        <label for="picker-b">Icon picker (button only, lang: en-us)</label>
        <div id="picker-b"></div>
      </div>
    </div>

    <hr>
    <button type="button" class="btn btn-primary" id="show-values">Pokaż aktualne wartości</button>
    <pre id="result" style="margin-top: 12px;"></pre>

    <hr>
    <h4>Przykłady użycia (HTML)</h4>
    <p class="text-muted">Markup + inicjalizacja z osobnym plikiem danych ikon i osobnym plikiem jezykowym.</p>
    <pre><code>&lt;!-- Wariant: button + input --&gt;
&lt;div id="my-icon-picker-full" data-value="la la-home"&gt;&lt;/div&gt;

&lt;script&gt;
  $("#my-icon-picker-full").icon_picker_bs_3({
    bootstrapVersion: 3,
    lang: "pl-pl",
    iconProvider: IconPickerBs3Providers.lineAwesome,
    categories: window.ICON_PICKER_LINE_AWESOME.categories,
    inputName: "icon_full",
    showInput: true,
    selectedIcon: "home"
  });
&lt;/script&gt;

&lt;!-- Wariant: sam button (bez input-group) --&gt;
&lt;div id="my-icon-picker-button"&gt;&lt;/div&gt;

&lt;script&gt;
  $("#my-icon-picker-button").icon_picker_bs_3({
    bootstrapVersion: 3,
    lang: "en-us",
    iconProvider: IconPickerBs3Providers.lineAwesome,
    categories: window.ICON_PICKER_LINE_AWESOME.categories,
    inputName: "icon_button",
    showInput: false,
    buttonOnly: true,
    selectedIcon: "search"
  });
&lt;/script&gt;</code></pre>
  </div>

  <script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/js/bootstrap.min.js"></script>
  <script src="./line-awesome-categories.js"></script>
  <script src="./icon-picker.locale.en-us.js"></script>
  <script src="./icon-picker.locale.pl-pl.js"></script>
  <script src="./icon-picker.js"></script>
  <script>
    (function ($) {
      var data = window.ICON_PICKER_LINE_AWESOME || {};
      var categories = data.categories || [];

      $("#picker-a").icon_picker_bs_3({
        bootstrapVersion: 3,
        lang: "pl-pl",
        iconProvider: IconPickerBs3Providers.lineAwesome,
        categories: categories,
        inputName: "icon_main",
        selectedIcon: "home",
        showInput: true,
        buttonOnly: false,
        enableSearch: true
      });

      $("#picker-b").icon_picker_bs_3({
        bootstrapVersion: 3,
        lang: "en-us",
        iconProvider: IconPickerBs3Providers.lineAwesome,
        categories: categories,
        inputName: "icon_compact",
        selectedIcon: "search",
        showInput: false,
        buttonOnly: true,
        enableSearch: true
      });

      $("#show-values").on("click", function () {
        var output = {
          pickerA_value: $("#picker-a").icon_picker_bs_3("getValue"),
          pickerA_icon: $("#picker-a").icon_picker_bs_3("getIcon"),
          pickerB_value: $("#picker-b").icon_picker_bs_3("getValue"),
          pickerB_icon: $("#picker-b").icon_picker_bs_3("getIcon")
        };

        $("#result").text(JSON.stringify(output, null, 2));
      });

      $("#picker-a, #picker-b").on("iconpicker:change", function (event, payload) {
        console.log("iconpicker:change", this.id, payload);
      });

      if (!categories.length) {
        $("#result").text("Brak danych kategorii ikon.");
      }
    })(jQuery);
  </script>
</body>
</html>
