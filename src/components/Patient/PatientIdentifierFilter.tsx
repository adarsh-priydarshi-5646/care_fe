import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useBreakpoints from "@/hooks/useBreakpoints";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  getPartialId,
  PartialPatientModel,
  PatientRead,
} from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import { getOrderedPatientIdentifierConfigs } from "@/Utils/patientUtils";
import query from "@/Utils/request/query";
import careConfig from "@careConfig";

interface Props {
  onSelect: (patientId: string | undefined) => void;
  placeholder?: string;
  className?: string;
  patientId?: string;
}

export default function PatientIdentifierFilter({
  onSelect,
  placeholder,
  className,
  patientId,
}: Props) {
  const { t } = useTranslation();
  const { facility, facilityId } = useCurrentFacility();
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<
    PatientRead | PartialPatientModel | null
  >(null);
  const [pendingPatient, setPendingPatient] = useState<
    PatientRead | PartialPatientModel | null
  >(null);
  const [searchType, setSearchType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [yearOfBirth, setYearOfBirth] = useState("");
  const [verificationOpen, setVerificationOpen] = useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });

  // Set initial patient ID if provided
  useEffect(() => {
    if (patientId && !selectedPatient) {
      setSelectedPatient({ id: patientId } as PatientRead);
    } else if (!patientId) {
      setSelectedPatient(null);
    }
  }, [patientId, selectedPatient]);

  // Set default search type to first identifier config (prioritize phone number)
  useEffect(() => {
    if (facility?.patient_instance_identifier_configs?.length && !searchType) {
      const phoneConfig = facility.patient_instance_identifier_configs.find(
        (c) => c.config.system === careConfig.phoneNumberConfigSystem,
      );
      setSearchType(
        phoneConfig?.id || facility.patient_instance_identifier_configs[0].id,
      );
    }
  }, [facility?.patient_instance_identifier_configs, searchType]);

  // Fetch patient details when patientId is provided
  const { data: patientDetails } = useQuery({
    queryKey: ["patient-details", patientId],
    queryFn: query(patientApi.getPatient, {
      pathParams: { id: patientId! },
    }),
    enabled: !!patientId,
  });

  // Update selectedPatient when patientDetails are fetched
  useEffect(() => {
    if (patientDetails) {
      setSelectedPatient(patientDetails);
    }
  }, [patientDetails]);

  // Check if current search type is phone number
  const isPhoneNumberConfig =
    facility?.patient_instance_identifier_configs?.find(
      (c) => c.id === searchType,
    )?.config.system === careConfig.phoneNumberConfigSystem;

  // Patient search query (for identifier-based search)
  const { data: patientList, isFetching: isPatientFetching } = useQuery({
    queryKey: ["patient-search", searchTerm, searchType],
    queryFn: query.debounced(patientApi.searchPatient, {
      body:
        searchType && searchTerm
          ? { config: searchType, value: searchTerm, page_size: 20 }
          : {},
    }),
    enabled:
      !!searchType &&
      !!searchTerm &&
      (!isPhoneNumberConfig || isValidPhoneNumber(searchTerm)),
  });

  // Patient verification query
  const { data: verifiedPatient, refetch: verifyPatient } = useQuery({
    queryKey: ["patient-verify", pendingPatient?.id, yearOfBirth],
    queryFn: query(patientApi.searchRetrieve, {
      pathParams: { facilityId },
      body: {
        phone_number: pendingPatient?.phone_number ?? "",
        year_of_birth: String(yearOfBirth),
        partial_id: pendingPatient ? getPartialId(pendingPatient) : "",
      },
    }),
    enabled: false,
  });

  const handleSelectPatient = useCallback(
    (patient: PatientRead | PartialPatientModel) => {
      setSelectedPatient(patient);
      setOpen(false);
      setSearchTerm("");
      onSelect(patient.id);
    },
    [onSelect],
  );

  // Handle successful verification
  useEffect(() => {
    if (verifiedPatient) {
      handleSelectPatient(verifiedPatient);
      setVerificationOpen(false);
      setYearOfBirth("");
      setPendingPatient(null);
    }
  }, [verifiedPatient, handleSelectPatient]);

  const handlePatientSelect = (patient: PatientRead | PartialPatientModel) => {
    if (patientList?.partial) {
      setPendingPatient(patient);
      setVerificationOpen(true);
      setYearOfBirth("");
    } else {
      handleSelectPatient(patient);
    }
  };

  const handleVerify = () => {
    if (!pendingPatient || !yearOfBirth || yearOfBirth.length !== 4) {
      toast.error(t("valid_year_of_birth"));
      return;
    }
    verifyPatient();
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) {
      return text;
    }

    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedSearchTerm})`, "gi"));

    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={index} className="text-gray-950 font-semibold">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const triggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="flex-1 justify-between bg-white border-none rounded-none font-normal"
    >
      {selectedPatient && !verificationOpen ? (
        <span className="text-primary-500 text-sm">{selectedPatient.name}</span>
      ) : (
        placeholder || t("search_patients")
      )}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const selectorContent = (
    <Command shouldFilter={false}>
      <div className="px-2 pt-2 pb-1">
        <div className="mb-2 text-xs font-medium text-gray-700">
          {t("search_by")}
        </div>
        <Select
          value={searchType}
          onValueChange={(value) => {
            setSearchType(value);
            setSearchTerm("");
          }}
        >
          <SelectTrigger className="w-full" data-cy="identifier-type-selector">
            <SelectValue placeholder={t("select_search_type")} />
          </SelectTrigger>
          <SelectContent>
            {getOrderedPatientIdentifierConfigs(facility).map((config) => (
              <SelectItem key={config.id} value={config.id}>
                {config.config.display}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="relative flex px-2 items-center">
        {isPhoneNumberConfig ? (
          <PhoneInput
            placeholder={
              searchType
                ? t("search_by_identifier", {
                    name: facility?.patient_instance_identifier_configs?.find(
                      (c) => c.id === searchType,
                    )?.config.display,
                  })
                : t("select_search_type")
            }
            value={searchTerm}
            onChange={(value) => setSearchTerm(value || "")}
            className={cn(
              "flex-1 focus-visible:ring-1 focus-within:ring-0 h-10",
              searchTerm && "rounded-r-none -mr-2",
            )}
          />
        ) : (
          <div className="relative flex flex-1 items-center">
            <Search className="absolute left-3 size-4 text-gray-500" />
            <Input
              type="text"
              placeholder={
                searchType
                  ? t("search_by_identifier", {
                      name: facility?.patient_instance_identifier_configs?.find(
                        (c) => c.id === searchType,
                      )?.config.display,
                    })
                  : t("select_search_type")
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "focus-visible:ring-0 focus:border-gray-300 h-10 pl-10 ",
                searchTerm && "rounded-r-none border-r-0",
              )}
            />
          </div>
        )}
        {searchTerm && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-l-none shadow-none text-gray-400 h-10 border-gray-300"
            onClick={() => setSearchTerm("")}
          >
            <X />
            <span className="sr-only">{t("clear_search")}</span>
          </Button>
        )}
      </div>

      <CommandList>
        {!searchTerm ? (
          <CommandEmpty>{t("start_typing_to_search")}</CommandEmpty>
        ) : isPatientFetching ? (
          <CommandEmpty>{t("searching")}</CommandEmpty>
        ) : !patientList?.results.length ? (
          <CommandEmpty>
            {t("no_results_found_for", { term: searchTerm })}
          </CommandEmpty>
        ) : (
          <CommandGroup>
            {patientList.results.map((patient) => (
              <CommandItem
                key={patient.id}
                value={patient.id}
                onSelect={() => handlePatientSelect(patient)}
                className="py-2"
              >
                <Check
                  className={cn(
                    "mr-2 size-4",
                    selectedPatient?.id === patient.id
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />
                <div className="flex flex-col md:flex-row md:justify-between md:items-center w-full">
                  <div className="text-gray-600 font-medium">
                    {highlightText(patient.name, searchTerm)}
                  </div>
                  <div className="text-xs flex items-center gap-2">
                    <span className="text-gray-500">
                      {patient.phone_number}
                    </span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );

  return (
    <>
      <div
        className={cn(
          "flex overflow-hidden border-gray-400 rounded-lg border",
          className,
        )}
      >
        {isMobile ? (
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            <DrawerContent className="px-0 pt-2 min-h-[50vh] max-h-[85vh]">
              <div className="mt-3 pb-[env(safe-area-inset-bottom)] px-2 overflow-y-auto flex-1">
                {selectorContent}
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 overflow-hidden rounded-lg">
              {selectorContent}
            </PopoverContent>
          </Popover>
        )}
        {selectedPatient && !verificationOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPatient(null);
              setPendingPatient(null);
              setSearchTerm("");
              onSelect(undefined);
            }}
            className="h-auto border-l px-2 hover:bg-transparent w-8 mr-3 pr-px rounded-none border-gray-400 text-gray-950"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <Dialog open={verificationOpen} onOpenChange={setVerificationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("verify_patient_identity")}</DialogTitle>
            <DialogDescription>
              {t("patient_birth_year_for_identity")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder={`${t("year_of_birth")} (YYYY)`}
              value={yearOfBirth}
              data-cy="year-of-birth-input"
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,4}$/.test(value)) {
                  setYearOfBirth(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleVerify();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVerificationOpen(false);
                setPendingPatient(null);
              }}
              data-cy="cancel-verification-button"
            >
              {t("cancel")}
            </Button>
            <Button
              className="mb-2"
              onClick={handleVerify}
              data-cy="confirm-verification-button"
            >
              {t("verify")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
