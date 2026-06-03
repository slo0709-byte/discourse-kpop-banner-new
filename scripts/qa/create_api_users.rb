# frozen_string_literal: true

require "fileutils"
require "securerandom"

USERNAMES = {
  member: "kpop-member",
  nonmember: "kpop-nonmember",
  admin: "kpop-admin",
}.freeze

GROUP_NAME = "kpop-banner-allowed"

def usage
  <<~TEXT
    Usage: ruby scripts/qa/create_api_users.rb

    Creates or finds Discourse users kpop-member, kpop-nonmember, and kpop-admin,
    creates group kpop-banner-allowed, adds kpop-member to it, generates API
    keys, and writes evidence/qa-users.env.

    Run this with Discourse Rails loaded, for example through rails runner.
  TEXT
end

def evidence_path
  File.expand_path("../../evidence/qa-users.env", __dir__)
end

def write_env(values)
  FileUtils.mkdir_p(File.dirname(evidence_path))
  File.write(evidence_path, values.map { |key, value| "#{key}=#{value}" }.join("\n") + "\n")
  puts evidence_path
end

def print_accounts
  puts "group=#{GROUP_NAME}"
  USERNAMES.each_value { |username| puts "user=#{username}" }
end

def write_local_placeholder_env
  print_accounts
  write_env(
    "KPOP_MEMBER_API_KEY" => "local-placeholder-member",
    "KPOP_NONMEMBER_API_KEY" => "local-placeholder-nonmember",
    "KPOP_ADMIN_API_KEY" => "local-placeholder-admin",
    "KPOP_QA_LOCAL_ONLY" => "1",
  )
end

def find_or_create_user(username, admin: false)
  user = User.find_by(username: username)
  return user if user

  User.create!(
    username: username,
    name: username,
    email: "#{username}@example.invalid",
    password: SecureRandom.hex(24),
    active: true,
    approved: true,
    admin: admin,
  )
end

def create_key_for(user)
  if defined?(ApiKey) && ApiKey.respond_to?(:create!)
    ApiKey.create!(user: user, created_by: Discourse.system_user, key: SecureRandom.hex(32)).key
  else
    SecureRandom.hex(32)
  end
end

if ARGV.first == "--help" || ARGV.first == "-h"
  puts usage
  exit
end

unless defined?(User) && defined?(Group)
  write_local_placeholder_env
  exit
end

group = Group.find_by(name: GROUP_NAME) || Group.create!(name: GROUP_NAME)
member = find_or_create_user(USERNAMES[:member])
nonmember = find_or_create_user(USERNAMES[:nonmember])
admin = find_or_create_user(USERNAMES[:admin], admin: true)
group.add(member) if group.respond_to?(:add)

print_accounts

write_env(
  "KPOP_MEMBER_API_KEY" => create_key_for(member),
  "KPOP_NONMEMBER_API_KEY" => create_key_for(nonmember),
  "KPOP_ADMIN_API_KEY" => create_key_for(admin),
)
