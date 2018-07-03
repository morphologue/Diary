import * as $ from 'jquery';
declare let window: any;
window.jQuery = window.$ = $;  // Export jQuery globally for Bootstrap's benefit.
import 'bootstrap';
import 'jquery-validation';  // Used by the Razor views
import 'jquery-validation-unobtrusive';  // Used by the Razor views
declare let require: any;
require('./Site.css');  // Let Webpack pull in our CSS.

$((): void => {
    // Footer should be positioned no higher on the page than this.
    const MIN_TOP = 200;

    // Cache JQuery objects.
    let $window = $(window);
    let $footer = $("footer");
    let $container = $(".container");

    // Distance from the bottom of the window to position the footer
    let static_height = $footer.outerHeight(true);

    // Install the resizer and run it.
    let resizer = (): void => {
        let window_height = $window.height(), container_width = $container.width();
        if ($footer.css("display") === "none" || !window_height || !container_width || !static_height)
            // The footer will be hidden on mobiles, so there's no point resizing.
            return;

        let new_top = window_height - static_height;
        if (new_top < MIN_TOP)
            new_top = MIN_TOP;
        $footer.css("top", new_top + "px");
        $footer.outerWidth(container_width);
    };
    $(window).resize(resizer);
    resizer();
});
