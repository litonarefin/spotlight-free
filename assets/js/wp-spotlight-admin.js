(function($) {
    // Notice Hide
    $('body').on('click', '.wp-spotlight-upgrade-popup .popup-dismiss', function(evt) {
        evt.preventDefault();
        $(this).closest('.wp-spotlight-upgrade-popup').fadeOut(200);
    });

    // Notice Show
    $('body').on('click', '.disabled', function(evt) {
        evt.preventDefault();
        $('.wp-spotlight-upgrade-popup').fadeIn(200);
    });
})(jQuery);