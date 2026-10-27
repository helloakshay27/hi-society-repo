import { useEffect, useState } from "react";
import { getOrganizationsByEmail, getUser, Organization } from "@/utils/auth";

export interface HiSocietyProduct {
  backendUrl: string;
}

/** Return the Hi-Society product backend for the currently selected org. */
export const useHiSocietyProductForSelectedOrganization = (): HiSocietyProduct | null => {
  const [product, setProduct] = useState<HiSocietyProduct | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      const user = getUser();
      const organizationId = localStorage.getItem("org_id");
      if (!user?.email || !organizationId) {
        setProduct(null);
        return;
      }

      try {
        const organizations = await getOrganizationsByEmail(user.email);
        const selectedOrganization = organizations.find(
          (organization: Organization) =>
            String(organization.id) === String(organizationId)
        );
        const hiSociety = selectedOrganization?.products?.find(
          (item) => item.product_code?.toUpperCase() === "HS"
        );

        if (!cancelled) {
          setProduct(hiSociety?.backend_url ? { backendUrl: hiSociety.backend_url } : null);
        }
      } catch (error) {
        console.error("Unable to get Hi-Society backend for selected organization", error);
        if (!cancelled) setProduct(null);
      }
    };

    void loadProduct();
    return () => {
      cancelled = true;
    };
  }, []);

  return product;
};
