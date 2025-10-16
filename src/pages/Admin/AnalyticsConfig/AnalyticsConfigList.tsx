import { useQuery } from "@tanstack/react-query";
import { Pencil, PlusIcon, Search } from "lucide-react";
import { useNavigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { AnalyticsConfigRead } from "@/types/analyticsConfig/analyticsConfig";
import analyticsConfigApi from "@/types/analyticsConfig/analyticsConfigApi";

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
        {t("adjust_analytics_config_filters")}
      </p>
    </Card>
  );
}

const RenderCard = ({
  configs,
  isLoading,
  onEdit,
}: {
  configs: AnalyticsConfigRead[];
  isLoading: boolean;
  onEdit: (id: string) => void;
}) => {
  const { t } = useTranslation();

  return (
    <div className="md:hidden space-y-4 px-4">
      {isLoading ? (
        <CardGridSkeleton count={5} />
      ) : configs.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {configs.map((config) => (
            <Card
              key={config.id}
              className="overflow-hidden bg-white rounded-lg transition-shadow hover:shadow-lg"
            >
              <CardContent className="p-6 relative">
                <div className="mb-4 border-b pb-2 border-gray-200">
                  <h3 className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("name")}
                  </h3>
                  <p className="mt-2 text-xl font-bold text-gray-900">
                    {config.name}
                  </p>
                </div>

                <div className="mb-4 flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[120px]">
                    <h3 className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("handler")}
                    </h3>
                    <Badge variant="outline" className="mt-1">
                      {config.handler}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <h3 className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("context_type")}
                    </h3>
                    <Badge variant="outline" className="mt-1">
                      {config.context_type}
                    </Badge>
                  </div>
                </div>

                {config.description && (
                  <div className="mb-4">
                    <h3 className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("description")}
                    </h3>
                    <p className="text-sm text-gray-900 break-words">
                      {config.description}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(config.id)}
                    className="hover:bg-primary/5"
                  >
                    <Pencil className="size-4 mr-2" />
                    {t("edit")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
};

const RenderTable = ({
  configs,
  isLoading,
  onEdit,
}: {
  configs: AnalyticsConfigRead[];
  isLoading: boolean;
  onEdit: (id: string) => void;
}) => {
  const { t } = useTranslation();

  return (
    <div className="hidden md:block overflow-hidden rounded-lg bg-white shadow-sm">
      {isLoading ? (
        <TableSkeleton count={5} />
      ) : configs.length === 0 ? (
        <EmptyState />
      ) : (
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("name")}
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("handler")}
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("context_type")}
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("description")}
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-200 bg-white">
            {configs.map((config) => (
              <TableRow key={config.id} className="hover:bg-gray-50">
                <TableCell className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {config.name}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap px-6 py-4">
                  <Badge variant="outline">{config.handler}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap px-6 py-4">
                  <Badge variant="outline">{config.context_type}</Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-md truncate">
                    {config.description || "-"}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap px-6 py-4 text-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(config.id)}
                  >
                    <Pencil className="size-4 mr-2" />
                    {t("edit")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default function AnalyticsConfigList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["analyticsConfig", qParams],
    queryFn: query.debounced(analyticsConfigApi.listAnalytics, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        name: qParams.name,
      },
    }),
  });

  const configs = response?.results || [];

  const handleEdit = (id: string) => {
    navigate(`/admin/analytics_config/${id}/edit`);
  };

  const handleCreate = () => {
    navigate("/admin/analytics_config/create");
  };

  return (
    <Page title={t("analytics_config")} hideTitleOnPage>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 px-4 md:px-0">
          <div className="mb-2">
            <h1 className="text-2xl font-bold">{t("analytics_config")}</h1>
            <p className="text-gray-600">
              {t("manage_and_view_analytics_configs")}
            </p>
          </div>

          <div className="mt-8 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2 top-2.5 size-4 text-gray-500" />
              <Input
                placeholder={t("search_analytics_configs")}
                className="pl-10 w-full"
                value={qParams.name || ""}
                onChange={(e) => updateQuery({ name: e.target.value })}
              />
            </div>

            <Button className="w-full sm:w-auto" onClick={handleCreate}>
              <PlusIcon className="size-4 mr-2" />
              {t("create_analytics_config")}
            </Button>
          </div>
        </div>

        <RenderTable
          configs={configs}
          isLoading={isLoading}
          onEdit={handleEdit}
        />
        <RenderCard
          configs={configs}
          isLoading={isLoading}
          onEdit={handleEdit}
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
