# frozen_string_literal: true

require "json"
require "webrick"
require_relative "../../lib/discourse_kpop_banner/data_window"

DATA_FILES = {
  "unified" => "charts-unified.json",
  "ichart" => "ichart-banner.json",
  "circle" => "circlechart-multi.json",
  "kpopping" => "kpopping-musicshows-details.json",
  "soridata" => "soridata-musicshow-wins-summary.json",
}.freeze

def required_source?(source)
  source == "soridata" || source == "kpopping"
end

def empty_payload_for(source)
  source == "circle" ? { "charts" => [] } : {}
end

def normalized_params(query)
  query.each_with_object({}) do |(key, value), params|
    params[key] = value
    params[key.to_sym] = value
  end
end

def local_username(req)
  req["Api-Username"].to_s
end

def local_logged_in?(req)
  req.query["logged_in"] == "1" || !local_username(req).empty?
end

def local_staff?(req)
  req.query["staff"] == "1" || local_username(req) == "kpop-admin"
end

def forbidden!(res)
  res.status = 403
  res["Content-Type"] = "application/json"
  res.body = JSON.dump("errors" => ["Forbidden"])
end

def local_can_access?(req, access_mode)
  case access_mode
  when "public_limited"
    true
  when "logged_in"
    local_logged_in?(req)
  when "admin"
    local_staff?(req)
  when "group"
    local_staff?(req) || local_username(req) == "kpop-member"
  else
    local_logged_in?(req)
  end
end

def serve_data(req, res, data_dir)
  source = req.query["source"].to_s.empty? ? "soridata" : req.query["source"]
  filename = DATA_FILES[source]
  raise WEBrick::HTTPStatus::NotFound if filename.nil?

  path = File.join(data_dir, filename)
  access_mode = req.query["access_mode"].to_s.empty? ? "public_limited" : req.query["access_mode"]
  return forbidden!(res) if !local_can_access?(req, access_mode)

  logged_in = local_logged_in?(req)

  if !File.file?(path)
    raise WEBrick::HTTPStatus::NotFound if required_source?(source)

    res["Cache-Control"] = DiscourseKpopBanner::DataWindow.cache_control_header(access_mode, logged_in:)
    res["Content-Type"] = "application/json"
    res.body = JSON.dump(empty_payload_for(source))
    return
  end

  payload = JSON.parse(File.read(path))
  filtered = DiscourseKpopBanner::DataWindow.filtered_payload(
    source,
    payload,
    access_mode:,
    logged_in:,
    staff: local_staff?(req),
    params: normalized_params(req.query),
  )

  res["Cache-Control"] = DiscourseKpopBanner::DataWindow.cache_control_header(access_mode, logged_in:)
  res["X-Kpop-Data-Mtime"] = File.mtime(path).to_i.to_s
  res["Content-Type"] = "application/json"
  res.body = JSON.dump(filtered)
rescue JSON::ParserError
  res.status = 500
  res["Content-Type"] = "application/json"
  res.body = JSON.dump("errors" => ["Invalid K-pop banner JSON"])
end

port = Integer(ENV.fetch("KPOP_QA_PORT", "48732"))
data_dir = ENV.fetch("KPOP_BANNER_DATA_DIR")
server = WEBrick::HTTPServer.new(
  Port: port,
  BindAddress: "127.0.0.1",
  AccessLog: [],
  Logger: WEBrick::Log.new(File::NULL),
)

server.mount_proc("/kpop/banner-data") { |req, res| serve_data(req, res, data_dir) }
server.mount_proc("/") do |_req, res|
  res["Content-Type"] = "text/plain"
  res.body = "K-pop banner local QA server\n"
end
server.mount_proc("/kpop/soridata-musicshow-wins") do |req, res|
  req.query["source"] = "soridata"
  serve_data(req, res, data_dir)
end

trap("TERM") { server.shutdown }
trap("INT") { server.shutdown }
server.start
