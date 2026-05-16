<?php

namespace WPSPOTLIGHT\Inc\Classes;

use WPSPOTLIGHT\Inc\Classes\Api\Users;
use WPSPOTLIGHT\Inc\Classes\Api\Themes;
use WPSPOTLIGHT\Inc\Classes\Api\Plugins;
use WPSPOTLIGHT\Inc\Classes\Api\AdminMenu;
use WPSPOTLIGHT\Inc\Classes\Api\MenuData;
use WPSPOTLIGHT\Inc\Classes\Api\Keymaps;
use WPSPOTLIGHT\Inc\Classes\Api\PostTypes;
use WPSPOTLIGHT\Inc\Classes\Api\MediaFiles;
use WPSPOTLIGHT\Inc\Classes\Api\Updates;
use WPSPOTLIGHT\Inc\Classes\Api\Multisite;
use WPSPOTLIGHT\Inc\Classes\Api\Miscellaneous;

// No, Direct access Sir !!!
if (! defined('ABSPATH')) {
    exit;
}

/**
 * REST_API
 *
 * @author Jewel Theme <support@jeweltheme.com>
 */
class REST_API {

    private static $_instance = null;

    public function __construct()
    {
        $this->include_apis();
    }

    public function include_apis() {
        Users::get_instance();
        Themes::get_instance();
        Plugins::get_instance();
        AdminMenu::get_instance();
        PostTypes::get_instance();
        MediaFiles::get_instance();
        Miscellaneous::get_instance();
        Keymaps::get_instance();
        Updates::get_instance();
        Multisite::get_instance();
    }

    public static function instance()
    {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }
}