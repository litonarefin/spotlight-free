<?php

namespace WPSPOTLIGHT\Inc\Classes\Api;

// no direct access allowed
if (!defined('ABSPATH')) {
    exit;
}

class Multisite {

    private static $instance = null;

    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct()
    {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    // Register the REST API routes
    public function register_routes() {
        register_rest_route('wpspotlight/v1', '/network-sites', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_network_sites'],
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

    // Callback function to get all sites in the network
    public function get_network_sites() {
        if (!is_multisite()) {
            return new \WP_Error('no_multisite', 'This WordPress installation is not a Multisite network.', ['status' => 400]);
        }

        $sites = get_sites();
        $site_data = [];
        foreach ($sites as $site) {
            $site_details = get_site($site);
            $site_data[] = [
                'site_id'    => $site_details->blog_id,
                'domain'     => $site_details->domain,
                'path'       => $site_details->path,
                'site_title' => $this->get_multisite_site_title($site_details->blog_id),
                'site_url'   => get_site_url($site_details->blog_id),
                'admin_url'  => get_admin_url($site_details->blog_id)
            ];
        }

        return rest_ensure_response([
            'status' => 'success',
            'sites'  => $site_data
        ]);
    }

    public function get_multisite_site_title($site_id)
    {
        // Use get_blog_details() to get details of the site
        $site_details = get_blog_details($site_id);

        // Check if the site details were successfully retrieved
        if ($site_details && !is_wp_error($site_details)) {
            return $site_details->blogname; // Return the site title (blogname)
        }

        // Return an error message if the site is not found
        return new \WP_Error('site_not_found', 'The specified site ID does not exist.');
    }
}