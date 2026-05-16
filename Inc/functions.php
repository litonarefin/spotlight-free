<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}



/*
 * @version       1.0.0
 * @package       JLTWP_Spotlight
 * @license       Copyright JLTWP_Spotlight
 */

if ( ! function_exists( 'jltwp_spotlight_option' ) ) {
	/**
	 * Get setting database option
	 *
	 * @param string $section default section name jltwp_spotlight_general .
	 * @param string $key .
	 * @param string $default .
	 *
	 * @return string
	 */
	function jltwp_spotlight_option( $section = 'jltwp_spotlight_general', $key = '', $default = '' ) {
		$settings = get_option( $section );

		return isset( $settings[ $key ] ) ? $settings[ $key ] : $default;
	}
}

if ( ! function_exists( 'jltwp_spotlight_exclude_pages' ) ) {
	/**
	 * Get exclude pages setting option data
	 *
	 * @return string|array
	 *
	 * @version 1.0.0
	 */
	function jltwp_spotlight_exclude_pages() {
		return jltwp_spotlight_option( 'jltwp_spotlight_triggers', 'exclude_pages', array() );
	}
}

if ( ! function_exists( 'jltwp_spotlight_exclude_pages_except' ) ) {
	/**
	 * Get exclude pages except setting option data
	 *
	 * @return string|array
	 *
	 * @version 1.0.0
	 */
	function jltwp_spotlight_exclude_pages_except() {
		return jltwp_spotlight_option( 'jltwp_spotlight_triggers', 'exclude_pages_except', array() );
	}
}

if ( ! function_exists( 'jltwp_spotlight_is_premium' ) ) {
	/**
	 * Check if the plugin is premium
	 *
	 * @return bool
	 */
	function jltwp_spotlight_is_premium() {
		return ( class_exists( '\\WPSPOTLIGHT\\Pro\\Spotlight_Pro' ) && ! empty( \WPSPOTLIGHT\Pro\Spotlight_Pro::is_premium() ) );
	}
}

if ( ! function_exists( 'jltwp_spotlight_is_plan' ) ) {
	/**
	 * Check if the plugin is premium
	 *
	 * @param string $plan
	 *
	 * @return bool
	 */
	function jltwp_spotlight_is_plan( $plan = 'starter' ) {
		return ( class_exists( '\\WPSPOTLIGHT\\Pro\\Spotlight_Pro' ) && ! empty( \WPSPOTLIGHT\Pro\Spotlight_Pro::is_plan( $plan ) ) );
	}
}