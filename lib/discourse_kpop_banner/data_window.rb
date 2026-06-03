# frozen_string_literal: true

module DiscourseKpopBanner
  module DataWindow
    module_function

    GUEST_LIMIT = 20
    GUEST_MAX_LIMIT = 50
    MEMBER_LIMIT = 50
    MEMBER_MAX_LIMIT = 200
    SORIDATA_KEYS = {
      "song" => "songWins",
      "artist" => "artistWins",
    }.freeze

    def filtered_payload(source, payload, access_mode:, logged_in:, staff:, params:)
      return payload if access_mode != "public_limited"
      return payload if staff && present?(params[:raw])

      context = pagination_context(logged_in:, params:)
      return soridata_payload(payload, context, params) if source == "soridata"

      logged_in ? payload : capped_payload(payload, context[:limit])
    end

    def cache_control_header(access_mode, logged_in:)
      access_mode == "public_limited" && !logged_in ? "public, max-age=60" : "private, max-age=60"
    end

    def pagination_context(logged_in:, params:)
      default_limit = logged_in ? MEMBER_LIMIT : GUEST_LIMIT
      max_limit = logged_in ? MEMBER_MAX_LIMIT : GUEST_MAX_LIMIT
      requested_limit = integer_param(params[:limit], default_limit)
      requested_offset = integer_param(params[:offset], 0)

      {
        limit: [[requested_limit, 1].max, max_limit].min,
        offset: [requested_offset, 0].max,
      }
    end

    def soridata_payload(payload, context, params)
      return combined_soridata_payload(payload, context) if !present?(params[:chart])

      chart = params[:chart].to_s == "artist" ? "artist" : "song"
      key = SORIDATA_KEYS.fetch(chart)
      payload.slice("source", "generatedAt", "year").merge(
        key => page_for(Array(payload[key]), context)["items"],
        "pagination" => page_for(Array(payload[key]), context)["pagination"],
      )
    end

    def combined_soridata_payload(payload, context)
      song_page = page_for(Array(payload["songWins"]), context)
      artist_page = page_for(Array(payload["artistWins"]), context)
      payload.slice("source", "generatedAt", "year").merge(
        "songWins" => song_page["items"],
        "artistWins" => artist_page["items"],
        "pagination" => {
          "songWins" => song_page["pagination"],
          "artistWins" => artist_page["pagination"],
        },
      )
    end

    def page_for(items, context)
      offset = context[:offset]
      limit = context[:limit]
      sliced = items.slice(offset, limit) || []
      next_offset = offset + sliced.length

      {
        "items" => sliced,
        "pagination" => {
          "limit" => limit,
          "offset" => offset,
          "total" => items.length,
          "hasMore" => next_offset < items.length,
          "nextOffset" => next_offset < items.length ? next_offset : nil,
        },
      }
    end

    def capped_payload(value, limit)
      case value
      when Array
        value.first(limit).map { |item| capped_payload(item, limit) }
      when Hash
        value.transform_values { |item| capped_payload(item, limit) }
      else
        value
      end
    end

    def integer_param(value, fallback)
      return fallback if !present?(value)

      Integer(value)
    rescue ArgumentError, TypeError
      fallback
    end

    def present?(value)
      !(value.nil? || (value.respond_to?(:empty?) && value.empty?))
    end
  end
end
