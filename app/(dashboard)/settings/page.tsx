import { ProfileForm, PasswordForm } from "@/components/forms/SettingsForms";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  let profile;
  try {
    profile = await getPrisma().profile.findUnique({ where: { id: user.id }, select: { displayName: true } });
  } catch {
    return <section className="border-l-4 border-[#d5845b] bg-white px-6 py-7"><p className="text-xs font-semibold uppercase text-[#9a5b39]">Settings unavailable</p><h1 className="mt-2 text-2xl font-semibold text-[#20392d]">Connect your database</h1><p className="mt-3 text-sm leading-6 text-[#718078]">Configure PostgreSQL before loading profile settings.</p></section>;
  }

  const email = user.email ?? "";
  const name = profile?.displayName || (typeof user.user_metadata.display_name === "string" ? user.user_metadata.display_name : "");

  return (
    <div className="space-y-8">
      <header><p className="text-sm font-medium text-[#46785b]">Preferences</p><h1 className="mt-2 text-3xl font-semibold text-[#1d352a]">Settings</h1><p className="mt-2 text-sm text-[#758279]">Manage your profile and sign-in security.</p></header>
      <section className="border-y border-[#dfe7df] py-6" aria-labelledby="profile-settings-heading"><h2 id="profile-settings-heading" className="text-lg font-semibold text-[#20392d]">Profile</h2><p className="mt-1 mb-5 text-sm text-[#758279]">Update the name shown across your banking workspace.</p><div className="mb-5 max-w-lg"><p className="text-sm font-medium text-[#394e42]">Email address</p><p className="mt-1.5 rounded-lg border border-[#e1e8e1] bg-[#f7f9f7] px-3 py-3 text-sm text-[#66756c]">{email}</p><p className="mt-1 text-xs text-[#7b887f]">Email is managed by Supabase Auth.</p></div><ProfileForm initialName={name} /></section>
      <section className="border-b border-[#dfe7df] py-6" aria-labelledby="security-settings-heading"><h2 id="security-settings-heading" className="text-lg font-semibold text-[#20392d]">Security</h2><p className="mt-1 mb-5 text-sm text-[#758279]">Choose a strong password unique to this account.</p><PasswordForm /></section>
      <p className="text-xs leading-5 text-[#7b887f]">This portfolio app stores profile details and simulated banking data only. Passwords are handled by Supabase Auth.</p>
    </div>
  );
}