# frozen_string_literal: true

require_relative "../plugin_helper"

RSpec.describe DiscourseKpopBanner::DataController do
  let(:data_dir) { Dir.mktmpdir("kpop-banner") }
  fab!(:user)
  fab!(:admin) { Fabricate(:admin) }
  fab!(:allowed_group) { Fabricate(:group) }

  before do
    SiteSetting.kpop_banner_enabled = true
    SiteSetting.kpop_banner_access_mode = "public_limited"
    SiteSetting.kpop_banner_data_dir = data_dir
  end

  after { FileUtils.remove_entry(data_dir) if Dir.exist?(data_dir) }

  it "serves filtered Soridata music show wins to anonymous users" do
    copy_kpop_banner_fixture(data_dir, "soridata-musicshow-wins-summary.json")

    get "/kpop/banner-data.json", params: { source: "soridata", chart: "song", limit: 20 }

    expect(response.status).to eq(200)
    expect(response.headers["Cache-Control"]).to eq("public, max-age=60")
    expect(response.headers["X-Kpop-Data-Mtime"]).to match(/\A\d+\z/)
    expect(response.parsed_body["songWins"].length).to eq(20)
    expect(response.parsed_body["songWins"].first).to include("rank" => 1, "title" => "SWIM", "artist" => "BTS")
    expect(response.parsed_body["pagination"]).to include("limit" => 20, "total" => 20, "hasMore" => false)
    expect(response.parsed_body).not_to have_key("artistWins")
  end

  it "caps an excessive anonymous Soridata limit" do
    payload = {
      "source" => "Soridata",
      "songWins" => Array.new(80) { |index| { "rank" => index + 1, "title" => "Song #{index + 1}" } },
      "artistWins" => [],
    }
    write_kpop_banner_data_file(data_dir, "soridata-musicshow-wins-summary.json", payload)

    get "/kpop/banner-data.json", params: { source: "soridata", chart: "song", limit: 5000 }

    expect(response.status).to eq(200)
    expect(response.parsed_body["songWins"].length).to eq(50)
    expect(response.parsed_body["pagination"]).to include("limit" => 50, "total" => 80, "hasMore" => true, "nextOffset" => 50)
  end

  it "serves the legacy Soridata endpoint with the same filtered contract" do
    copy_kpop_banner_fixture(data_dir, "soridata-musicshow-wins-summary.json")

    get "/kpop/soridata-musicshow-wins.json", params: { chart: "artist", limit: 2 }

    expect(response.status).to eq(200)
    expect(response.parsed_body["artistWins"].length).to eq(2)
    expect(response.parsed_body).not_to have_key("songWins")
    expect(response.parsed_body["pagination"]).to include("limit" => 2, "total" => 252)
  end

  it "returns not found when the plugin is disabled" do
    SiteSetting.kpop_banner_enabled = false

    get "/kpop/banner-data.json", params: { source: "circle" }

    expect(response.status).to eq(404)
  end

  it "returns an empty optional Circle payload when the data file is absent" do
    get "/kpop/banner-data.json", params: { source: "circle" }

    expect(response.status).to eq(200)
    expect(response.parsed_body).to eq("charts" => [])
  end

  it "returns not found when required Soridata data is absent" do
    get "/kpop/banner-data.json", params: { source: "soridata" }

    expect(response.status).to eq(404)
  end

  it "returns a narrow invalid JSON error without leaking file contents" do
    File.write(File.join(data_dir, "soridata-musicshow-wins-summary.json"), '{"songWins":[')

    get "/kpop/banner-data.json", params: { source: "soridata" }

    expect(response.status).to eq(500)
    expect(response.parsed_body).to eq("errors" => ["Invalid K-pop banner JSON"])
  end

  it "requires a signed-in user in logged_in mode" do
    copy_kpop_banner_fixture(data_dir, "soridata-musicshow-wins-summary.json")
    SiteSetting.kpop_banner_access_mode = "logged_in"

    get "/kpop/banner-data.json", params: { source: "soridata" }
    expect(response.status).to eq(404).or eq(403)

    sign_in(user)
    get "/kpop/banner-data.json", params: { source: "soridata", chart: "song", limit: 80 }

    expect(response.status).to eq(200)
    expect(response.headers["Cache-Control"]).to eq("private, max-age=60")
    expect(response.parsed_body["songWins"].length).to eq(20)
  end

  it "requires admin access in admin mode" do
    copy_kpop_banner_fixture(data_dir, "soridata-musicshow-wins-summary.json")
    SiteSetting.kpop_banner_access_mode = "admin"

    sign_in(user)
    get "/kpop/banner-data.json", params: { source: "soridata" }
    expect(response.status).to eq(403)

    sign_in(admin)
    get "/kpop/banner-data.json", params: { source: "soridata" }
    expect(response.status).to eq(200)
  end

  it "allows only configured group members in group mode" do
    copy_kpop_banner_fixture(data_dir, "soridata-musicshow-wins-summary.json")
    SiteSetting.kpop_banner_access_mode = "group"
    SiteSetting.kpop_banner_allowed_groups = allowed_group.id.to_s

    sign_in(user)
    get "/kpop/banner-data.json", params: { source: "soridata" }
    expect(response.status).to eq(403)

    allowed_group.add(user)
    get "/kpop/banner-data.json", params: { source: "soridata" }
    expect(response.status).to eq(200)
  end
end
