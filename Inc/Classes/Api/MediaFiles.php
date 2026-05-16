<?php

namespace WPSPOTLIGHT\Inc\Classes\Api;

// no direct access allowed
if (!defined('ABSPATH')) {
    exit;
}

class MediaFiles
{
    private static $instance = null;

    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('admin_enqueue_scripts', [$this, 'wpspotlight_enqueue_media_insert_script']);
    }

    function wpspotlight_enqueue_media_insert_script($hook)
    {

        wp_enqueue_media();
        // Only enqueue on post editing screens
        if ($hook === 'post.php' || $hook === 'post-new.php') {
            // wp_enqueue_script('wpspotlight-media-insert', plugin_dir_url(__FILE__) . 'wpspotlight-media-insert.js', ['jquery'], '1.0', true);
            // $this->media_insert_script();
        }
    }

    public function register_routes()
    {
        register_rest_route('wpspotlight/v1', '/media-search', [
            'methods' => 'GET',
            'callback' => [$this, 'search_media_files'],
            'permission_callback' => [$this, 'check_permissions'],
            'args' => [
                'search' => [
                    'required' => false,
                    'validate_callback' => function ($param) {
                        return is_string($param);
                    },
                ],
                'mime_type' => [
                    'required' => false,
                    'validate_callback' => function ($param) {
                        return is_string($param);
                    },
                ],
                'date' => [
                    'required' => false,
                    'validate_callback' => function ($param) {
                        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $param);
                    },
                ],
            ],
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

    public function search_media_files($request) {
        $search = sanitize_text_field($request->get_param('search'));
        $mime_type = sanitize_text_field($request->get_param('mime_type'));
        $date = sanitize_text_field($request->get_param('date'));

        // Set up the query arguments
        $args = [
            'post_type' => 'attachment',
            'posts_per_page' => 4,
            'post_status' => 'inherit',
        ];

        // Add search criteria if provided
        if (!empty($search)) {
            $args['s'] = $search;
        }
        if (!empty($mime_type)) {
            $args['post_mime_type'] = $mime_type;
        }
        if (!empty($date)) {
            $args['date_query'] = [
                [
                    'year' => substr($date, 0, 4),
                    'month' => substr($date, 5, 2),
                    'day' => substr($date, 8, 2),
                ],
            ];
        }

        $query = new \WP_Query($args);
        $media_files = [];

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                // $file_url = wp_get_attachment_url(get_the_ID());
                $file_path = get_attached_file(get_the_ID());
                // $base_name = pathinfo($file_path, PATHINFO_FILENAME);

                // Get all file variants with different extensions
                $all_variants = $this->get_all_file_variants($file_path);

                foreach ($all_variants as $variant) {
                    $edit_attachment_url = admin_url('post.php?post=' . get_the_ID() . '&action=edit');

                     // Each variant will have all main media file details along with unique filename and extension
                    $media_files[] = [
                        'id' => get_the_ID(),
                        'title' => get_the_title(),
                        'url' => $variant['url'], // Variant-specific URL
                        'mime_type' => get_post_mime_type(get_the_ID()),
                        'date' => get_the_date('Y-m-d H:i:s'),
                        'filename' => $variant['filename'], // Variant-specific filename
                        'extension' => $variant['extension'], // Variant-specific extension
                        'edit_url' => $edit_attachment_url
                    ];
                }
            }
        }

        wp_reset_postdata();

        return rest_ensure_response($media_files);
    }

    // Helper function to get all file variants by extension
    private function get_all_file_variants($file_path) {
        $directory = dirname($file_path);
        $base_name = pathinfo($file_path, PATHINFO_FILENAME);
        $available_files = [];

        $upload_dir = wp_get_upload_dir();

        // Check for files with the same base name and any extension in the directory
        foreach (glob("$directory/$base_name.*") as $file) {
            $available_files[] = [
                'filename' => basename($file),
                'extension' => pathinfo($file, PATHINFO_EXTENSION),
                'url' => str_replace( $upload_dir['basedir'], $upload_dir['baseurl'], $file ),
            ];
        }

        return $available_files;
    }
}