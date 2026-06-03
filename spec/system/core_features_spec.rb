# frozen_string_literal: true

RSpec.describe "K-pop banner core features", type: :system do
  before do
    enable_current_plugin
    SiteSetting.kpop_banner_enabled = true
  end

  it "loads the forum home page with the plugin enabled" do
    visit "/"

    expect(page).to have_css("body")
  end
end
