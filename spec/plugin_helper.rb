# frozen_string_literal: true

require "rails_helper"
require "fileutils"
require "tmpdir"

module KpopBannerSpecHelper
  def write_kpop_banner_data_file(data_dir, filename, payload)
    FileUtils.mkdir_p(data_dir)
    File.write(File.join(data_dir, filename), JSON.dump(payload))
  end

  def copy_kpop_banner_fixture(data_dir, filename)
    FileUtils.mkdir_p(data_dir)
    FileUtils.cp(File.join(__dir__, "fixtures", filename), File.join(data_dir, filename))
  end
end

RSpec.configure { |config| config.include KpopBannerSpecHelper }
