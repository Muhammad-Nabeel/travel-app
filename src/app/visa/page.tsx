import { VisaResults } from "@/components/features/visa/visa-results";
import { getStoredVisaCountries } from "@/lib/admin-settings/visa-settings";

export default async function VisaPage() {
  const visaResults = await getStoredVisaCountries();
  const activeResults = visaResults
    .filter((item) => item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const countryOptions = Array.from(
    new Set(activeResults.map((item) => item.country)),
  );
  const popularCountries = countryOptions.slice(0, 6);

  return (
    <main className="flex-1">
      <VisaResults
        results={activeResults}
        countryOptions={countryOptions}
        popularCountries={popularCountries}
      />
    </main>
  );
}
