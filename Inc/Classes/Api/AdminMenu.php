<?php

namespace WPSPOTLIGHT\Inc\Classes\Api;

// no direct access allowed
if (!defined('ABSPATH')) {
    exit;
}

/**
 * AdminMenu
 *
 * @author Jewel Theme <support@jeweltheme.com>
 */
class AdminMenu
{
    private static $instance = null;
    public $admin_menus = [];

    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct()
    {
        add_filter('parent_file', array($this, 'capture_wp_menu'), 999999999);
        add_action('init', array($this, 'maybe_register_premium_hooks'), 1);
    }

    public function maybe_register_premium_hooks()
    {
        if ( ! jltwp_spotlight_is_premium() ) {
            return;
        }
        // Hook the inline script specifically for Elementor editor pages
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only screen detection from Elementor's own query string.
        if ( isset( $_GET['action'] ) && 'elementor' === sanitize_key( wp_unslash( $_GET['action'] ) ) && isset( $_GET['post'] ) ) {
            add_action('elementor/editor/after_enqueue_scripts', [$this, 'capture_wp_menu']);
        }
    }


    public function capture_wp_menu($parent_file)
    {
        global $menu, $submenu;

        $menu_build = $this->jltwp_adminify_build_menu($menu, $submenu);

        $this->enqueue_menu($menu_build);
        return $parent_file;
    }


    public function enqueue_menu($menu)
    {
        $outputter = function () use ($menu) {

            $menu_settings = [
                'menu_data' => $menu,
            ];

            $data = "var wp_spotlight_menu=" . json_encode($menu_settings);
            \wp_print_inline_script_tag($data, ["id" => "wp_spotlight_menu"]);
        };

        add_action("admin_footer", $outputter, 0);
        add_action("wp_footer", $outputter, 0);
    }


    public function enqueue_menu_elementor($menu) {
        // Define the inline script output function
        $outputter = function () use ($menu) {
            $menu_settings = [
                'menu_data' => $menu,
            ];

            // Encode the menu data as a JavaScript variable
            $data = "var wp_spotlight_menu = " . json_encode($menu_settings) . ";";

            // Register a dummy script handle to attach the inline script
            wp_register_script('wp_spotlight_menu_script', false, array(), WPSPOTLIGHT_VER, true);

            // Add the inline script to the dummy handle
            wp_add_inline_script('wp_spotlight_menu_script', $data);

            // Enqueue the dummy script handle to print the inline script
            wp_enqueue_script('wp_spotlight_menu_script');
        };

        // Hook the inline script for WordPress admin pages
        add_action('admin_footer', $outputter, 0);
        add_action("wp_footer", $outputter, 0);

        // // Hook the inline script specifically for Elementor editor pages
        // add_action('elementor/editor/after_enqueue_scripts', $outputter, 10000);


        if (\Elementor\Plugin::instance()->editor->is_edit_mode() || \Elementor\Plugin::instance()->preview->is_preview_mode()) {
            add_action('wp_print_footer_scripts', $outputter, 999);
        }
    }


    function jltwp_adminify_build_menu($menu, $submenu)
    {
        $admin_menu = [];

        foreach ($menu as $parent_item) {
            $parent_title = !empty($parent_item[0]) ? wp_strip_all_tags($parent_item[0]) : "";
            $parent_slug  = $parent_item[2];

            if (is_network_admin()) {
                // Determine if the parent link needs 'admin.php?page=' prefix
                $parent_link = (strpos($parent_slug, 'http') === 0 || strpos($parent_slug, 'https') === 0) ? $parent_slug : (get_plugin_page_hook($parent_slug, 'admin.php') ? network_admin_url("admin.php?page=$parent_slug") : network_admin_url($parent_slug));
            } else{
                // Determine if the parent link needs 'admin.php?page=' prefix
                $parent_link = (strpos($parent_slug, 'http') === 0 || strpos($parent_slug, 'https') === 0) ? $parent_slug : (get_plugin_page_hook($parent_slug, 'admin.php') ? admin_url("admin.php?page=$parent_slug") : admin_url($parent_slug));

            }


            // Skip if parent title is empty
            if (empty($parent_title)) {
                continue;
            }

            $has_identical_submenu = false; // Flag to check if any submenu link matches the parent link

            // Check for submenus and format them
            if (!empty($submenu[$parent_slug])) {
                foreach ($submenu[$parent_slug] as $sub_item) {
                    $sub_title = !empty($sub_item[0]) ? wp_strip_all_tags($sub_item[0]) : "";
                    $sub_slug  = $sub_item[2];

                    // Skip if submenu title is empty
                    if (empty($sub_title)) {
                        continue;
                    }

                    // Determine if the submenu link needs 'admin.php?page=' prefix
                    if (is_network_admin()) {
                        $sub_link = (strpos($sub_slug, 'http') === 0 || strpos($sub_slug, 'https') === 0) ? $sub_slug : (get_plugin_page_hook($sub_slug, $parent_slug) ? network_admin_url("admin.php?page=$sub_slug") : network_admin_url($sub_slug));
                    } else {
                        $sub_link = (strpos($sub_slug, 'http') === 0 || strpos($sub_slug, 'https') === 0) ? $sub_slug : (get_plugin_page_hook($sub_slug, $parent_slug) ? admin_url("admin.php?page=$sub_slug") : admin_url($sub_slug));
                    }


                    // Check if parent link and submenu link are the same
                    if ($parent_link === $sub_link) {
                        $has_identical_submenu = true; // Mark that there's a matching submenu link
                    }

                    // Combine parent and submenu item into a single content string
                    $admin_menu[] = [
                        'title' => "$parent_title > $sub_title",
                        'url'    => $sub_link,
                        'direction' => 'link',
                    ];
                }
            }

            // Add the parent menu item only if no identical submenu link was found
            if (!$has_identical_submenu) {
                $admin_menu[] = [
                    'title' => $parent_title,
                    'url'    => $parent_link,
                    'direction' => 'link',
                ];
            }
        }

        return $admin_menu;
    }




    // Rest Menu Route
    public function register_routes()
    {
        // Register REST route for retrieving admin menus
        register_rest_route('wpspotlight/v1', '/admin-menus', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_admin_menus'],
            'permission_callback' => [$this, 'check_permissions'],
        ]);
    }

    // Check REST API permissions
    public function check_permissions()
    {
        if (current_user_can('manage_options') || current_user_can('manage_woocommerce')) {
            return true;
        } else {
            return false;
        }
    }

    public function capture_admin_menus()
    {
        global $menu, $submenu;

        // Load the menu structure if it's not populated
        if (empty($menu) || empty($submenu)) {
            require_once ABSPATH . 'wp-admin/includes/menu.php';
            // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Intentionally triggering core admin_menu to rebuild menu structure.
            do_action('admin_menu');
        }

        foreach ($menu as $parent_menu) {
            // Capture parent menu details
            $parent_title = $parent_menu[0];
            $parent_slug = $parent_menu[2];
            $parent_link = admin_url($parent_slug);

            // Start building the parent menu array with title and link
            $parent_menu_data = [
                'title' => wp_strip_all_tags($parent_title),
                'menu_link' => $parent_link,
                'submenus' => [],
                'direction' => 'link',
            ];

            // Check if there are submenus under this parent menu
            if (isset($submenu[$parent_slug]) && !empty($submenu[$parent_slug])) {
                foreach ($submenu[$parent_slug] as $sub_menu) {
                    $submenu_data = [
                        'title' => wp_strip_all_tags($sub_menu[0]),
                        'menu_link' => admin_url($sub_menu[2]),
                        'direction' => 'link',
                    ];
                    $parent_menu_data['submenus'][] = $submenu_data;
                }
            }

            // Add parent menu and its submenus to the final array
            $this->admin_menus[] = $parent_menu_data;
        }
    }

    public function get_admin_menus()
    {
        // Ensure menus are captured before output
        if (empty($this->admin_menus)) {
            $this->capture_admin_menus();
        }

        return rest_ensure_response([
            'status' => 'success',
            'admin_menus' => $this->admin_menus
        ]);
    }
}