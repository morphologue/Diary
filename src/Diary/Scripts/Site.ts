import $ = require('jquery');
(window as any).jQuery = (window as any).$ = $;  // Export jQuery globally for Bootstrap's benefit.
import '../node_modules/bootstrap/dist/js/bootstrap.js';

$((): void => {
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

    // Install the resizer and run it.
    let resizer = (): void => {
        if ($footer.css("display") === "none")
            // The footer will be hidden on mobiles, so there's no point resizing.
            return;

        let new_top = $window.height() - static_height;
        $footer.css("top", (new_top > MIN_TOP ? new_top : MIN_TOP) + "px");
        $footer.width($container.width() - MARGIN_RIGHT);
    };
    $(window).resize(resizer);
    resizer();
});
