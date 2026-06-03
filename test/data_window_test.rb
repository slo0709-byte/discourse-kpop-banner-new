# frozen_string_literal: true

require "minitest/autorun"
require_relative "../lib/discourse_kpop_banner/data_window"

class DataWindowTest < Minitest::Test
  def sample_payload
    {
      "source" => "Soridata",
      "generatedAt" => "2026-06-03T00:10:04.955Z",
      "year" => 2026,
      "songWins" => Array.new(120) { |index| { "rank" => index + 1, "title" => "Song #{index + 1}" } },
      "artistWins" => Array.new(75) { |index| { "rank" => index + 1, "artist" => "Artist #{index + 1}" } },
    }
  end

  def test_guest_soridata_is_capped_and_reports_next_offset
    result = DiscourseKpopBanner::DataWindow.filtered_payload(
      "soridata",
      sample_payload,
      access_mode: "public_limited",
      logged_in: false,
      staff: false,
      params: { chart: "song", limit: "5000", offset: "0" },
    )

    assert_equal 50, result["songWins"].length
    assert_equal({ "limit" => 50, "offset" => 0, "total" => 120, "hasMore" => true, "nextOffset" => 50 }, result["pagination"])
    refute result.key?("artistWins")
  end

  def test_guest_soridata_song_chart_uses_requested_limit_within_cap
    result = DiscourseKpopBanner::DataWindow.filtered_payload(
      "soridata",
      sample_payload,
      access_mode: "public_limited",
      logged_in: false,
      staff: false,
      params: { chart: "song", limit: "20" },
    )

    assert_equal 20, result["songWins"].length
    assert_equal({ "limit" => 20, "offset" => 0, "total" => 120, "hasMore" => true, "nextOffset" => 20 }, result["pagination"])
  end

  def test_malformed_limit_and_offset_fall_back_to_safe_defaults
    result = DiscourseKpopBanner::DataWindow.filtered_payload(
      "soridata",
      sample_payload,
      access_mode: "public_limited",
      logged_in: false,
      staff: false,
      params: { chart: "song", limit: "not-a-number", offset: "-40" },
    )

    assert_equal 20, result["songWins"].length
    assert_equal 0, result["pagination"]["offset"]
    assert_equal 20, result["pagination"]["limit"]
  end

  def test_logged_in_soridata_can_page_beyond_guest_cap
    result = DiscourseKpopBanner::DataWindow.filtered_payload(
      "soridata",
      sample_payload,
      access_mode: "public_limited",
      logged_in: true,
      staff: false,
      params: { chart: "song", limit: "80", offset: "50" },
    )

    assert_equal 70, result["songWins"].length
    assert_equal 51, result["songWins"].first["rank"]
    assert_equal({ "limit" => 80, "offset" => 50, "total" => 120, "hasMore" => false, "nextOffset" => nil }, result["pagination"])
  end

  def test_soridata_without_chart_returns_both_guest_slices
    result = DiscourseKpopBanner::DataWindow.filtered_payload(
      "soridata",
      sample_payload,
      access_mode: "public_limited",
      logged_in: false,
      staff: false,
      params: {},
    )

    assert_equal 20, result["songWins"].length
    assert_equal 20, result["artistWins"].length
    assert_equal 120, result["pagination"]["songWins"]["total"]
    assert_equal 75, result["pagination"]["artistWins"]["total"]
  end

  def test_staff_raw_can_read_full_payload
    result = DiscourseKpopBanner::DataWindow.filtered_payload(
      "soridata",
      sample_payload,
      access_mode: "public_limited",
      logged_in: true,
      staff: true,
      params: { raw: "1", limit: "1" },
    )

    assert_equal 120, result["songWins"].length
    assert_equal 75, result["artistWins"].length
    refute result.key?("pagination")
  end

  def test_non_soridata_guest_arrays_are_capped_recursively
    payload = {
      "charts" => {
        "ichart" => {
          "periods" => {
            "day" => { "items" => Array.new(90) { |index| { "rank" => index + 1 } } },
          },
        },
      },
    }

    result = DiscourseKpopBanner::DataWindow.filtered_payload(
      "unified",
      payload,
      access_mode: "public_limited",
      logged_in: false,
      staff: false,
      params: { limit: "5000" },
    )

    assert_equal 50, result["charts"]["ichart"]["periods"]["day"]["items"].length
  end

  def test_public_limited_logged_in_non_soridata_returns_full_payload
    payload = {
      "charts" => {
        "ichart" => {
          "periods" => {
            "day" => { "items" => Array.new(90) { |index| { "rank" => index + 1 } } },
          },
        },
      },
    }

    result = DiscourseKpopBanner::DataWindow.filtered_payload(
      "unified",
      payload,
      access_mode: "public_limited",
      logged_in: true,
      staff: false,
      params: { limit: "20" },
    )

    assert_equal 90, result["charts"]["ichart"]["periods"]["day"]["items"].length
  end

  def test_cache_header_is_private_for_logged_in_public_limited_requests
    assert_equal "public, max-age=60", DiscourseKpopBanner::DataWindow.cache_control_header("public_limited", logged_in: false)
    assert_equal "private, max-age=60", DiscourseKpopBanner::DataWindow.cache_control_header("public_limited", logged_in: true)
    assert_equal "private, max-age=60", DiscourseKpopBanner::DataWindow.cache_control_header("logged_in", logged_in: true)
    assert_equal "private, max-age=60", DiscourseKpopBanner::DataWindow.cache_control_header("admin", logged_in: true)
    assert_equal "private, max-age=60", DiscourseKpopBanner::DataWindow.cache_control_header("group", logged_in: true)
  end

  def test_non_public_modes_return_full_payload
    %w[logged_in group admin].each do |access_mode|
      result = DiscourseKpopBanner::DataWindow.filtered_payload(
        "soridata",
        sample_payload,
        access_mode: access_mode,
        logged_in: true,
        staff: access_mode == "admin",
        params: { chart: "song", limit: "1" },
      )

      assert_equal 120, result["songWins"].length
      assert_equal 75, result["artistWins"].length
      refute result.key?("pagination")
    end
  end
end
