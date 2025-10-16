import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { AnalyticsUrlResponse } from "@/types/analyticsConfig/analyticsConfig";
import analyticsConfigApi from "@/types/analyticsConfig/analyticsConfigApi";

interface AnalyticsViewerProps {
  facilityId: string;
  analyticsConfigId: string;
}

export default function AnalyticsViewer({
  facilityId,
  analyticsConfigId,
}: AnalyticsViewerProps) {
  const { t } = useTranslation();
  const [analyticsUrl, setAnalyticsUrl] = useState<string | null>(null);

  // Fetch the analytics config details
  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["analyticsConfig", analyticsConfigId],
    queryFn: query(analyticsConfigApi.retrieveAnalyticsConfig, {
      pathParams: { analyticsConfigId },
    }),
  });

  // Generate analytics URL
  const generateUrlMutation = useMutation({
    mutationFn: mutate(analyticsConfigApi.generateAnalyticsUrl, {
      pathParams: { analyticsConfigId },
    }),
    onSuccess: (data: AnalyticsUrlResponse) => {
      console.log(data);
      setAnalyticsUrl(data.redirect_url);
    },
    onError: () => {
      toast.error(t("failed_to_generate_analytics_url"));
    },
  });

  useEffect(() => {
    if (config) {
      // Generate URL when config is loaded
      generateUrlMutation.mutate({
        context_id: facilityId,
      });
    }
  }, [config, facilityId]);

  const handleBack = () => {
    navigate(`/facility/${facilityId}/analytics`);
  };

  const handleRefresh = () => {
    setAnalyticsUrl(null);
    generateUrlMutation.mutate({
      context: {
        facility_id: facilityId,
      },
    });
  };

  if (isLoadingConfig) {
    return (
      <Page title={t("analytics")} hideTitleOnPage>
        <div className="container mx-auto px-4 py-6">
          <FormSkeleton rows={8} />
        </div>
      </Page>
    );
  }

  if (!config) {
    return (
      <Page title={t("analytics")} hideTitleOnPage>
        <div className="container mx-auto px-4 py-6">
          <Card className="p-8 text-center">
            <CareIcon
              icon="l-exclamation-circle"
              className="size-12 mx-auto mb-4 text-red-500"
            />
            <h3 className="text-lg font-semibold mb-2">
              {t("analytics_config_not_found")}
            </h3>
            <p className="text-gray-600 mb-4">
              {t("analytics_config_not_found_description")}
            </p>
            <Button onClick={handleBack}>
              <CareIcon icon="l-arrow-left" className="mr-2" />
              {t("back_to_analytics")}
            </Button>
          </Card>
        </div>
      </Page>
    );
  }

  return (
    <Page title={config.name} hideTitleOnPage>
      <div className="h-screen flex flex-col">
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <CareIcon icon="l-arrow-left" className="mr-2" />
              {t("back")}
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {config.name}
              </h1>
              {config.description && (
                <p className="text-sm text-gray-600">{config.description}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={generateUrlMutation.isPending}
          >
            <CareIcon
              icon="l-sync"
              className={`mr-2 ${generateUrlMutation.isPending ? "animate-spin" : ""}`}
            />
            {t("refresh")}
          </Button>
        </div>

        <div className="flex-1 relative">
          {generateUrlMutation.isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <CareIcon
                  icon="l-spinner"
                  className="size-8 animate-spin mx-auto mb-2 text-primary"
                />
                <p className="text-sm text-gray-600">
                  {t("loading_analytics")}
                </p>
              </div>
            </div>
          )}

          {generateUrlMutation.isError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <Card className="p-8 text-center max-w-md">
                <CareIcon
                  icon="l-exclamation-triangle"
                  className="size-12 mx-auto mb-4 text-red-500"
                />
                <h3 className="text-lg font-semibold mb-2">
                  {t("failed_to_load_analytics")}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t("failed_to_load_analytics_description")}
                </p>
                <Button onClick={handleRefresh}>
                  <CareIcon icon="l-redo" className="mr-2" />
                  {t("try_again")}
                </Button>
              </Card>
            </div>
          )}

          {analyticsUrl && !generateUrlMutation.isPending && (
            <iframe
              src={analyticsUrl}
              className="w-full h-full border-0"
              title={config.name}
              allow="fullscreen"
            />
          )}
        </div>
      </div>
    </Page>
  );
}
