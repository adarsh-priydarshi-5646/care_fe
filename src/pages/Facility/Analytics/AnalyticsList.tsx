import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useNavigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import Page from "@/components/Common/Page";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { AnalyticsConfigRead } from "@/types/analyticsConfig/analyticsConfig";
import analyticsConfigApi from "@/types/analyticsConfig/analyticsConfigApi";

interface AnalyticsListProps {
  facilityId: string;
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <CareIcon icon="l-chart-line" className="size-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">
        {t("no_analytics_configs_found")}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {t("no_analytics_available_for_facility")}
      </p>
    </Card>
  );
}

function AnalyticsCards({
  configs,
  isLoading,
  onView,
}: {
  configs: AnalyticsConfigRead[];
  isLoading: boolean;
  onView: (id: string) => void;
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return <CardGridSkeleton count={6} />;
  }

  if (configs.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {configs.map((config) => (
        <Card
          key={config.id}
          className="overflow-hidden bg-white rounded-lg transition-all hover:shadow-lg cursor-pointer hover:scale-[1.02]"
          onClick={() => onView(config.id)}
        >
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {config.name}
            </h3>

            {config.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {config.description}
              </p>
            )}

            <div className="mt-2 flex items-center text-sm text-primary">
              <span>{t("view_dashboard")}</span>
              <CareIcon icon="l-arrow-right" className="size-4 ml-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AnalyticsList({ facilityId }: AnalyticsListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["analyticsConfig", "facility", facilityId, qParams],
    queryFn: query.debounced(analyticsConfigApi.listAnalytics, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        name: qParams.name,
        context_type: "facility",
      },
    }),
  });

  const configs = response?.results || [];

  const handleView = (id: string) => {
    navigate(`/facility/${facilityId}/analytics/${id}`);
  };

  return (
    <Page title={t("analytics")} hideTitleOnPage>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 px-4 md:px-0">
          <div className="mb-2">
            <h1 className="text-2xl font-bold">{t("analytics")}</h1>
            <p className="text-gray-600">{t("view_facility_analytics")}</p>
          </div>

          <div className="mt-8 mb-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2 top-2.5 size-4 text-gray-500" />
              <Input
                placeholder={t("search_analytics_configs")}
                className="pl-10 w-full"
                value={qParams.name || ""}
                onChange={(e) => updateQuery({ name: e.target.value })}
              />
            </div>
          </div>
        </div>

        <AnalyticsCards
          configs={configs}
          isLoading={isLoading}
          onView={handleView}
        />

        {response && response.count > resultsPerPage && (
          <div className="mt-4 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
