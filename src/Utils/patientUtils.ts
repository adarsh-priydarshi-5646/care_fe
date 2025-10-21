import { TFunction } from "i18next";

import { FacilityRead } from "@/types/facility/facility";
import careConfig from "@careConfig";

/**
 * Generate search options for patient identifier search
 * @param t - Translation function
 * @param searchIdentifier - Current search state (config and value)
 * @param facility - Facility with identifier configs
 * @returns Array of search options for SearchInput component
 */
export const getPatientSearchOptions = (
  t: TFunction,
  searchIdentifier: { config?: string; value?: string },
  facility?: FacilityRead,
) => {
  if (!facility) {
    return [];
  }

  const { patient_instance_identifier_configs: configs } = facility;

  // Phone number configs first, followed by auto-maintained configs, and then non-auto-maintained configs
  return [
    // Phone number configs
    ...configs.filter(
      ({ config }) =>
        config.auto_maintained &&
        config.system === careConfig.phoneNumberConfigSystem,
    ),
    // Auto-maintained configs but not phone number configs
    ...configs.filter(
      ({ config }) =>
        config.auto_maintained &&
        config.system !== careConfig.phoneNumberConfigSystem,
    ),
    // Non-auto-maintained configs
    ...configs.filter((c) => !c.config.auto_maintained),
  ].map((c) => ({
    key: c.id,
    type:
      c.config.system === careConfig.phoneNumberConfigSystem
        ? ("phone" as const)
        : ("text" as const),
    placeholder: t("search_by_identifier", { name: c.config.display }),
    value:
      searchIdentifier.config === c.id ? (searchIdentifier.value ?? "") : "",
    display: c.config.display,
  }));
};

/**
 * Generate ordered patient identifier configs for PatientIdentifierFilter
 * @param facility - Facility with identifier configs
 * @returns Ordered array of identifier configs
 */
export const getOrderedPatientIdentifierConfigs = (facility?: FacilityRead) => {
  if (!facility?.patient_instance_identifier_configs?.length) {
    return [];
  }

  return [
    // Phone number configs first
    ...facility.patient_instance_identifier_configs.filter(
      (c) =>
        c.config.auto_maintained &&
        c.config.system === careConfig.phoneNumberConfigSystem,
    ),
    // Auto-maintained configs but not phone number configs
    ...facility.patient_instance_identifier_configs.filter(
      (c) =>
        c.config.auto_maintained &&
        c.config.system !== careConfig.phoneNumberConfigSystem,
    ),
    // Non-auto-maintained configs
    ...facility.patient_instance_identifier_configs.filter(
      (c) => !c.config.auto_maintained,
    ),
  ];
};
