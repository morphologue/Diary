/* tslint:disable comment-format */
function makeTableResizer() {
    // Search box should not shrink below this.
    var MIN_WIDTH = 10;
    // Leave this space at the right, which matches the right padding on the nav pills, so that the
    // search box lines up with the rightmost pill.
    var MARGIN_RIGHT = 15;
    // Cache JQuery objects.
    var $controls = $("#table_controls");
    var $input = $("#table_controls > input");
    var $target = $("#table_target");
    var $footer = $("footer");
    // The search box will be sized to the width of the div less this space, which equates to the width of the 
    // "+" button plus a bit.
    var static_width = $input.offset().left - $controls.offset().left + MARGIN_RIGHT;
    // #table_target will be resized to the top of the footer less this distance, which equates to the height
    // of the nav and search bar combined.
    var static_height = $target.offset().top;
    return function () {
        // Resize the search box
        var new_width = $controls.width() - static_width;
        $input.outerWidth(new_width > MIN_WIDTH ? new_width : MIN_WIDTH);
        // On phones the footer is hidden and div#target_table will overflow, so that the whole document scrolls. However on
        // desktops the div should itself scroll and take up the central part of the window, with the footer underneath.
        $target.height($footer.css("display") === "none" ? 0 : $footer.offset().top - static_height);
    };
}
$(function () {
    // Install the resizer when the document has loaded. Importantly, the event handler must be bound after
    // makeFooterResizer() in Site.ts, as this resizer relies on $footer.offset() being up-to-date. The layout
    // page currently guarantees this ordering.
    var resizer = makeTableResizer();
    $(window).resize(resizer);
    resizer();
    EntryDialog.initialize();
    $("#table_controls > button").click(function () { return new EntryDialog(true, "", new Date("2015-01-01"), "Sydney", "Hello World!").show(); });
});
//# sourceMappingURL=Index.js.map