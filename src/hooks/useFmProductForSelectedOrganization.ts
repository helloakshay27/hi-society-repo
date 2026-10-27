import { useEffect, useState } from "react";
import { getOrganizationsByEmail, getUser, Organization } from "@/utils/auth";

export interface FmProduct {
  backendUrl: string;
  frontendUrl: string;
  organizationId: number;
}

/** Return the FM product only when it belongs to the currently selected org. */
export const useFmProductForSelectedOrganization = (): FmProduct | null => {
  const [fmProduct, setFmProduct] = useState<FmProduct | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadFmProduct = async () => {
      const user = getUser();
      const organizationId = localStorage.getItem("org_id");
      if (!user?.email || !organizationId) {
        setFmProduct(null);
        return;
      }

      try {
        const organizations = await getOrganizationsByEmail(user.email);
        const selectedOrganization = organizations.find(
          (organization: Organization) =>
            String(organization.id) === String(organizationId)
        );
        const fm = selectedOrganization?.products?.find(
          (product) => product.product_code?.toUpperCase() === "FM"
        );

        if (!cancelled && fm?.backend_url && fm.frontend_url) {
          setFmProduct({
            backendUrl: fm.backend_url,
            frontendUrl: fm.frontend_url,
            organizationId: selectedOrganization.id,
          });
        } else if (!cancelled) {
          setFmProduct(null);
        }
      } catch (error) {
        console.error("Unable to check FM product access for selected organization", error);
        if (!cancelled) setFmProduct(null);
      }
    };

    void loadFmProduct();
    return () => {
      cancelled = true;
    };
  }, []);

  return fmProduct;
};
