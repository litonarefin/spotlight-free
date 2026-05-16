<?php
namespace WPSPOTLIGHT\Inc\Classes\Api;

use WP_REST_Server;

// no direct access allowed
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Users
 *
 * @author Jewel Theme <support@jeweltheme.com>
 */

class Users {
    private static $instance = null;

    private function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('wpspotlight/v1', '/get-user-roles', [
            'methods' => 'GET',
            'callback' => [$this, 'get_user_roles'],
            'permission_callback' => [$this, 'check_permissions'],
            'args' => [],
        ]);

        register_rest_route('wpspotlight/v1', '/get-users-by-role', [
            'methods' => 'GET',
            'callback' => [$this, 'get_users_by_role'],
            'permission_callback' => [$this, 'check_permissions'],
            'args' => [
                'role' => [
                    'required' => true,
                    'validate_callback' => function ($param) {
                        return true;
                    },
                ],
            ],
        ]);

        register_rest_route('wpspotlight/v1', '/get-users-by-email', [
            'methods' => 'GET',
            'callback' => [$this, 'get_users_by_email'],
            'permission_callback' => [$this, 'check_permissions'],
            'args' => [
                'role' => [
                    'required' => false,
                    'validate_callback' => function ($param) {
                        return true;
                    },
                ],
                'name' => [
                    'required' => false,
                    'validate_callback' => function ($param) {
                        return true;
                    },
                ],
                'email' => [
                    'required' => false,
                    'validate_callback' => function ($param) {
                        return true;
                    },
                ],
            ],
        ]);

        register_rest_route('wpspotlight/v1', '/send-reset-password', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'send_reset_password_link'],
            'permission_callback' => [$this, 'check_permissions'],
            'args' => [
                'user_id' => [
                    'required' => true,
                    'validate_callback' => function ($param) {
                        return is_numeric($param);
                    },
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

    public function get_user_roles($request) {
        global $wp_roles;

        if ( ! isset( $wp_roles ) ) $wp_roles = new \WP_Roles();

        return $wp_roles->get_names();
    }

    public function get_users_by_role($request) {
        $role = sanitize_text_field($request->get_param('role'));

        $args = array(
            'role'    => $role,
            'orderby' => 'user_nicename',
            'order'   => 'ASC',
            'number'  => 4
        );

        $users = new \WP_User_Query( $args );

        $result = [];

        foreach ($users->results as $key => $value) {
            $user_ID = get_current_user_id();
            $current_user = false;
            if( $user_ID == $value->data->ID ) {
                $current_user = true;
            }

            $result[$key]['id'] = $value->data->ID;
            $result[$key]['email'] = $value->data->user_email;
            $result[$key]['name'] = $value->data->display_name;
            $result[$key]['edit_url'] = add_query_arg( 'user_id', $value->data->ID, self_admin_url( 'user-edit.php' ) );
            $result[$key]['view_url'] = get_author_posts_url($value->data->ID);
            $result[$key]['current_user'] = $current_user;
        }

        return $result;
    }

    public function get_users_by_email($request) {
        $name = sanitize_text_field($request->get_param('name'));
        $role = sanitize_text_field($request->get_param('role'));
        $email = $request->get_param('email');

        $args = [
            'search' => '*',
            'search_columns' => [],
            'number'    => 6
        ];


        if ($name) {
            $args['search'] = '*' . esc_attr($name) . '*';
            $args['search_columns'][] = 'display_name';
            $args['search_columns'][] = 'user_login';
            if( !empty($role) ) {
                $args['role'] = array( $role );
            }
        } elseif ($email) {
            $args['search'] = '*' . esc_attr($email) . '*';
            $args['search_columns'][] = 'user_email';
            if( !empty($role) ) {
                $args['role'] = array( $role );
            }
        }
        $user_query = new \WP_User_Query($args);
        $users = $user_query->get_results();


        $data = [];
        foreach ($users as $user) {
            $user_ID = get_current_user_id();
            $current_user = false;
            if( $user_ID === $user->ID ) {
                $current_user = true;
            }

            $data[] = [
                'id' => $user->ID,
                'name' => $user->display_name,
                'email' => $user->user_email,
                'username' => $user->user_login,
                'roles' => $user->roles,
                'edit_url' => add_query_arg( 'user_id', $user->ID, self_admin_url( 'user-edit.php' ) ),
                'view_url' => get_author_posts_url($user->ID),
                'current_user' => $current_user
            ];
        }

        return $data;
    }

    public function send_reset_password_link($request) {
        $user_id = sanitize_text_field($request->get_param('user_id'));

         // Check if the user Id is associated with a user account
         if (!$user_id) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => "User ID is required for reset password"
            ]);
        }

        $user = get_user_by('ID', $user_id);

        // Generate a password reset key
        $reset_key = get_password_reset_key($user);

        if (is_wp_error($reset_key)) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => 'Could not generate a password reset key.'
            ]);
        }

        // Create the password reset URL
        $reset_url = add_query_arg([
            'action' => 'rp',
            'key'    => $reset_key,
            'login'  => rawurlencode($user->user_login),
        ], wp_login_url());

        // Send the email
        $subject = 'Password Reset Request';
        $message = "Hello,\n\nTo reset your password, please click the link below:\n\n" . $reset_url . "\n\nIf you did not request this, please ignore this email.";

        if (!wp_mail($user->data->user_email, $subject, $message)) {
            return rest_ensure_response([
                'status' => 'error',
                'message' => 'Failed to send the password reset email.'
            ]);
        }

        return rest_ensure_response([
            'status' => 'success',
            'message' => 'Password reset email sent.'
        ]);
    }


    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
}