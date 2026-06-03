# frozen_string_literal: true

require "fileutils"
require "json"
require "tmpdir"

FIXTURE_FILES = {
  ["soridata", "valid"] => "soridata-musicshow-wins-summary.json",
  ["kpopping", "valid"] => "kpopping-musicshows-details.json",
}.freeze

OUTPUT_FILES = {
  "soridata" => "soridata-musicshow-wins-summary.json",
  "unified" => "charts-unified.json",
  "circle" => "circlechart-multi.json",
  "kpopping" => "kpopping-musicshows-details.json",
}.freeze

VARIANTS = %w[valid invalid malicious].freeze

def usage
  <<~TEXT
    Usage: ruby scripts/qa/write_fixture.rb <source> <valid|invalid|malicious>

    Sources: #{OUTPUT_FILES.keys.join(", ")}
    Writes into SiteSetting.kpop_banner_data_dir inside Discourse, otherwise
    ENV["KPOP_BANNER_DATA_DIR"] or a temporary directory.
  TEXT
end

def data_dir
  return ARGV[2] if ARGV[2]

  if defined?(SiteSetting) && SiteSetting.respond_to?(:kpop_banner_data_dir)
    SiteSetting.kpop_banner_data_dir
  else
    ENV.fetch("KPOP_BANNER_DATA_DIR", File.join(Dir.tmpdir, "kpop-banner-qa-data"))
  end
end

def fixture_root
  File.expand_path("../../spec/fixtures", __dir__)
end

def read_fixture(source, variant)
  fixture_name = FIXTURE_FILES[[source, variant]]
  return File.read(File.join(fixture_root, fixture_name)) if fixture_name

  if variant == "invalid"
    return '{"items":['
  end

  malicious_record = {
    "rank" => 1,
    "title" => "<script>window.__kpopXss=1</script>",
    "artist" => "Artist <img src=x onerror=alert(1)>",
    "album" => "javascript:alert(1)",
  }

  case [source, variant]
  when ["soridata", "malicious"]
    JSON.pretty_generate(
      "source" => "Soridata",
      "songWins" => [
        malicious_record.merge("show" => "QA Show", "wins" => 1),
      ],
    )
  when ["unified", "valid"]
    JSON.pretty_generate(
      "generatedAt" => "2026-06-03T00:00:00Z",
      "charts" => [
        {
          "source" => "qa",
          "chart" => "song",
          "rank" => 1,
          "title" => "Fixture Song",
          "artist" => "Fixture Artist",
          "album" => "Fixture Album",
          "platforms" => [{ "name" => "Melon", "rank" => 1, "score" => 99 }],
        },
      ],
    )
  when ["unified", "malicious"]
    JSON.pretty_generate(
      "generatedAt" => "2026-06-03T00:00:00Z",
      "charts" => [
        {
          "source" => "qa",
          "chart" => "song",
          "rank" => 1,
          "title" => "<script>window.__kpopXss=1</script>",
          "artist" => "Artist <img src=x onerror=alert(1)>",
          "album" => "javascript:alert(1)",
          "showName" => "QA Show",
          "platforms" => [{ "name" => "<b>Melon</b>", "rank" => 1, "score" => 99 }],
        },
      ],
    )
  when ["circle", "valid"]
    JSON.pretty_generate(
      "generatedAt" => "2026-06-03T00:00:00Z",
      "charts" => {
        "globalKpop" => [
          {
            "rank" => 1,
            "title" => "Fixture Song",
            "artist" => "Fixture Artist",
            "album" => "Fixture Album",
          },
        ],
      },
    )
  when ["circle", "malicious"]
    JSON.pretty_generate(
      "generatedAt" => "2026-06-03T00:00:00Z",
      "charts" => {
        "globalKpop" => [
          malicious_record,
        ],
      },
    )
  when ["kpopping", "malicious"]
    JSON.pretty_generate(
      "generatedAt" => "2026-06-03T00:00:00Z",
      "shows" => [
        malicious_record.merge("showName" => "QA Show", "winner" => true),
      ],
    )
  else
    abort usage
  end
end

source = ARGV.fetch(0, nil)
variant = ARGV.fetch(1, nil)

if source == "--help" || source == "-h"
  puts usage
  exit
end

output_name = OUTPUT_FILES[source]
abort usage if output_name.nil? || !VARIANTS.include?(variant)

payload = read_fixture(source, variant)
target_dir = data_dir
FileUtils.mkdir_p(target_dir)
target_path = File.join(target_dir, output_name)
File.write(target_path, payload)
puts target_path
