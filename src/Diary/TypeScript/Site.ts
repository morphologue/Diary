import $ = require('jquery');

function makeFooterResizer(): () => void {
    // Pixels to reserve under the footer, i.e. at the bottom of the window
    const MARGIN_BOTTOM = 20;

    // Leave this space at the right, which matches the right padding on the nav pills, so that the
    // hr lines up with the rightmost pill.
    const MARGIN_RIGHT = 15;

    // Footer should be positioned no higher on the page than this.
    const MIN_TOP = 200;

    // Cache JQuery objects.
    let $window = $(window);
    let $footer = $("footer");
    let $container = $(".container");

    // Distance from the bottom of the window to position the footer
    let static_height = $footer.height() + MARGIN_BOTTOM;

    return (): void => {
        if ($footer.css("display") === "none")
            // The footer will be hidden on mobiles, so there's no point resizing.
            return;

        let new_top = $window.height() - static_height;
        $footer.css("top", (new_top > MIN_TOP ? new_top : MIN_TOP) + "px");
        $footer.width($container.width() - MARGIN_RIGHT);
    };
}

$((): void => {
    // Install the resizer when the document has loaded.
    let resizer = makeFooterResizer();
    $(window).resize(resizer);
    resizer();
});
