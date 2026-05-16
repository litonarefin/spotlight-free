<?php
namespace WPSPOTLIGHT\Inc\Classes\Api;

// no direct access allowed
if (!defined('ABSPATH')) {
    exit;
}

/**
 * PostTypes
 *
 * @author Jewel Theme <support@jeweltheme.com>
 */

class PostTypes
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
    }

    public function register_routes()
    {
        register_rest_route('wpspotlight/v1', '/registered-post-types', [
            'methods' => 'GET',
            'callback' => [$this, 'get_registered_post_types'],
            'permission_callback' => [$this, 'check_permissions'],
        ]);

        // Route for getting all posts by a specific post type
        register_rest_route('wpspotlight/v1', '/posts-by-type', [
            'methods' => 'GET',
            'callback' => [$this, 'get_posts_by_type'],
            'permission_callback' => [$this, 'check_permissions'],
            'args' => [
                'post_type' => [
                    'required' => true,
                    'validate_callback' => function ($param) {
                        return post_type_exists($param);
                    },
                ],
            ],
        ]);

        // Route for getting all posts by a specific post type
        register_rest_route('wpspotlight/v1', '/search-by-post-types', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_search_by_post_types'],
            'permission_callback' => [$this, 'check_permissions'],
            'args'                => [
                'post_type' => [
                    'required' => true,
                    'validate_callback' => function ($param) {
                        return post_type_exists($param);
                    },
                ],
                'search_text' => [
                    'required' => true,
                    'validate_callback' => function ($param) {
                        return is_string($param);
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

    // Callback for the REST API to check if a post is "Edit with Bricks" and return the edit URL
    public function is_post_editable_with_bricks($request) {
        // Get the post ID from the request
        $post_id = (int) $request->get_param('post_id');

        // Ensure the post exists
        $post = get_post($post_id);
        if (!$post) {
            return rest_ensure_response([
                'status'  => 'error',
                'message' => 'Post not found.',
            ]);
        }



        // Initialize the "Edit with Bricks" URL as null
        $edit_with_bricks_url = null;

        // If the post is editable with Bricks, generate the URL
        if ($is_editable) {
            $edit_with_bricks_url = add_query_arg(
                ['post' => $post_id, 'action' => 'bricks'],
                admin_url('post.php')
            );
        }

        // Return the result with the URL
        return rest_ensure_response([
            'status'               => 'success',
            'post_id'              => $post_id,
            'editable'             => $is_editable,
            'edit_with_bricks_url' => $edit_with_bricks_url,
        ]);
    }


    public function get_registered_post_types() {
        // Exclude specific post types
        $excluded_types = ['nav_menu_item', 'comments', 'attachment', 'wp_template_part', 'wp_template'];

        // Retrieve all post types and exclude the specified ones
        $post_types = get_post_types(['public' => true], 'objects');
        $filtered_post_types = [];

        foreach ($post_types as $slug => $post_type) {
            if (!in_array($slug, $excluded_types)) {
                $filtered_post_types[] = [
                    'name' => $post_type->label,
                    'slug' => $slug,
                    'description' => $post_type->description,
                    'public' => $post_type->public,
                    'show_in_rest' => $post_type->show_in_rest,
                ];
            }
        }

        return rest_ensure_response(['status' => 'success', 'post_types' => $filtered_post_types]);
    }

    public function get_posts_by_type($request) {
        $post_type = sanitize_text_field($request->get_param('post_type'));

        // Query for posts of the specified post type
        $query_args = [
            'post_type'      => $post_type,
            'posts_per_page' => 4,
        ];

        $query = new \WP_Query($query_args);
        $posts = [];

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();

                $edit_post_type_url = admin_url('post.php?post=' . get_the_ID() . '&action=edit');
                $posts[] = [
                    'id' => get_the_ID(),
                    'title' => get_the_title(),
                    // 'excerpt' => get_the_excerpt(),
                    // 'date' => get_the_date('Y-m-d H:i:s'),
                    'link' => get_permalink(get_the_ID()),
                    'edit_url' => $edit_post_type_url,

                ];
            }
        }

        wp_reset_postdata();

        return rest_ensure_response([
            'status' => 'success',
            'post_type' => $post_type,
            'posts' => $posts,
        ]);
    }

    public function get_search_by_post_types($request) {
        $post_type = sanitize_text_field($request->get_param('post_type'));
        $search_text = sanitize_text_field($request->get_param('search_text'));

        // Query for posts of the specified post type
        $query_args = [
            'post_type'      => $post_type,
            'posts_per_page' => -1,
            'post_status'    => array('publish', 'pending', 'draft', 'auto-draft', 'future', 'private', 'inherit', 'trash'),
            's'              => $search_text,
        ];

        $query = new \WP_Query($query_args);
        $posts = [];

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();


                $edit_post_type_url = admin_url('post.php?post=' . get_the_ID() . '&action=edit');
                $posts[] = [
                    'id'          => get_the_ID(),
                    'title'       => get_the_title(),
                    'post_status' => get_post_status(),
                    // 'excerpt' => get_the_excerpt(),
                    // 'date' => get_the_date('Y-m-d H:i:s'),
                    'link' => get_permalink(get_the_ID()),
                    'edit_url' => $edit_post_type_url,

                ];
            }
        }

        wp_reset_postdata();

        return rest_ensure_response([
            'status' => 'success',
            'post_type' => $post_type,
            'posts' => $posts,
        ]);
    }
}