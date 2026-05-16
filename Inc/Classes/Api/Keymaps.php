<?php

namespace WPSPOTLIGHT\Inc\Classes\Api;

// no direct access allowed
if (!defined('ABSPATH')) {
    exit;
}

class Keymaps
{
    private static $instance = null;
    private $option_name = '_wpspotlight_keymaps';

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

    // Register REST API routes
    public function register_routes()
    {
        // Route to get the saved keymaps data
        register_rest_route('wpspotlight/v1', '/keymaps', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_keymaps_data'],
            'permission_callback' => [$this, 'check_permissions'],
        ]);

        // Route to post data to save keymaps data
        register_rest_route('wpspotlight/v1', '/keymaps', [
            'methods' => 'POST',
            'callback' => [$this, 'post_keymaps_data'],
            'permission_callback' => [$this, 'check_permissions'],
        ]);

        register_rest_route('wpspotlight/v1', '/save-tour-status', [
            'methods' => 'POST',
            'callback' => [$this, 'save_tour_status'],
            'permission_callback' => [$this, 'check_permissions'],     
            'args'                => [
                'tour_completed' => [
                    'required' => true,
                    'validate_callback' => function ($param) {
                        return true;
                    }
                ],
            ],
        ]);
    }

    // Check REST API permissions
    public function check_permissions()
    {
        if (current_user_can('manage_options')) {
            return true;
        } else {
            return false;
        }
    }


    public function save_tour_status($request) {
        $tour_completed = $request->get_param('tour_completed');

        if ($tour_completed) {
            update_option('_wpspotlight_tour_completed', true);
            return rest_ensure_response([
                'status' => 'success',
                'message' => 'Tour completion status saved.',
            ]);
        }

        return rest_ensure_response([
            'status' => 'error',
            'message' => 'Invalid tour completion data.',
        ]);
    }

    // GET route callback: Retrieve keymaps data from options
    public function get_keymaps_data()
    {
        $keymaps_data = get_option($this->option_name, []);
        return rest_ensure_response([
            'status' => 'success',
            'data' => !empty($keymaps_data) ? json_decode($keymaps_data) : [],
        ]);
    }

    // POST route callback: Save keymaps data to options
    public function post_keymaps_data($request)
    {
        $keymaps_data = wp_kses_post_deep($request->get_body());

        if (update_option($this->option_name, $keymaps_data)) {
            return rest_ensure_response([
                'status' => 'success',
                'message' => 'Keymaps data saved successfully.',
            ]);
        } else {
            return rest_ensure_response([
                'status' => 'error',
                'message' => 'Failed to save keymaps data.',
            ]);

        }
    }
}