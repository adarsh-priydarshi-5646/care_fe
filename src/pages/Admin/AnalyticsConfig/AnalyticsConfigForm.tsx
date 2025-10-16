import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  AnalyticsConfigCreate,
  AnalyticsContextType,
  AnalyticsHandler,
} from "@/types/analyticsConfig/analyticsConfig";
import analyticsConfigApi from "@/types/analyticsConfig/analyticsConfigApi";

interface AnalyticsConfigFormProps {
  id?: string;
}

export default function AnalyticsConfigForm({ id }: AnalyticsConfigFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const [handlerArgsJson, setHandlerArgsJson] = useState("{}");
  const [contextMappingJson, setContextMappingJson] = useState("{}");
  const [metadataJson, setMetadataJson] = useState("{}");

  const analyticsConfigSchema = z.object({
    name: z.string().trim().min(1, t("field_required")),
    description: z.string().trim().optional(),
    handler: z.nativeEnum(AnalyticsHandler, {
      required_error: t("field_required"),
    }),
    context_type: z.nativeEnum(AnalyticsContextType, {
      required_error: t("field_required"),
    }),
  });

  type AnalyticsConfigFormValues = z.infer<typeof analyticsConfigSchema>;

  const form = useForm<AnalyticsConfigFormValues>({
    resolver: zodResolver(analyticsConfigSchema),
    defaultValues: {
      name: "",
      description: "",
      handler: AnalyticsHandler.metabase,
      context_type: AnalyticsContextType.facility,
    },
  });

  // Fetch existing config data when editing
  const { data: existingConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["analyticsConfig", id],
    queryFn: query(analyticsConfigApi.retrieveAnalyticsConfig, {
      pathParams: { analyticsConfigId: id! },
    }),
    enabled: isEditing,
  });

  // Populate form when editing data is loaded
  useEffect(() => {
    if (existingConfig && isEditing) {
      form.reset({
        name: existingConfig.name,
        description: existingConfig.description || "",
        handler: existingConfig.handler,
        context_type: existingConfig.context_type,
      });
      setHandlerArgsJson(
        JSON.stringify(existingConfig.handler_args || {}, null, 2),
      );
      setContextMappingJson(
        JSON.stringify(existingConfig.context_mapping || {}, null, 2),
      );
      setMetadataJson(JSON.stringify(existingConfig.metadata || {}, null, 2));
    }
  }, [existingConfig, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: mutate(analyticsConfigApi.createAnalyticsConfig),
    onSuccess: () => {
      toast.success(t("analytics_config_created_successfully"));
      queryClient.invalidateQueries({ queryKey: ["analyticsConfig"] });
      navigate("/admin/analytics_config");
    },
    onError: () => {
      toast.error(t("analytics_config_creation_failed"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: mutate(analyticsConfigApi.updateAnalyticsConfig, {
      pathParams: { analyticsConfigId: id! },
    }),
    onSuccess: () => {
      toast.success(t("analytics_config_updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["analyticsConfig"] });
      navigate("/admin/analytics_config");
    },
    onError: () => {
      toast.error(t("analytics_config_update_failed"));
    },
  });

  const onSubmit = (data: AnalyticsConfigFormValues) => {
    try {
      const handlerArgs = JSON.parse(handlerArgsJson);
      const contextMapping = JSON.parse(contextMappingJson);
      const metadata = JSON.parse(metadataJson);

      const payload: AnalyticsConfigCreate = {
        name: data.name,
        description: data.description,
        handler: data.handler,
        handler_args: handlerArgs,
        context_type: data.context_type,
        context_mapping: contextMapping,
        metadata: metadata,
      };

      if (isEditing) {
        updateMutation.mutate(payload);
      } else {
        createMutation.mutate(payload);
      }
    } catch (_error) {
      toast.error(t("invalid_json_format"));
    }
  };

  const isLoading =
    isLoadingConfig || createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingConfig) {
    return (
      <Page title={t("analytics_config")} hideTitleOnPage>
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <FormSkeleton rows={8} />
        </div>
      </Page>
    );
  }

  return (
    <Page title={t("analytics_config")} hideTitleOnPage>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-700">
            {isEditing
              ? t("edit_analytics_config")
              : t("create_analytics_config")}
          </h1>
          <p className="text-gray-600 text-sm">
            {isEditing
              ? t("update_analytics_config_description")
              : t("create_analytics_config_description")}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("enter_analytics_config_name")}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("enter_description")}
                      {...field}
                      disabled={isLoading}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="handler"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("handler")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger ref={field.ref}>
                        <SelectValue placeholder={t("select_handler")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AnalyticsHandler).map((handler) => (
                        <SelectItem key={handler} value={handler}>
                          {handler}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t("handler_args")}
              </label>
              <Textarea
                value={handlerArgsJson}
                onChange={(e) => setHandlerArgsJson(e.target.value)}
                placeholder='{"key": "value"}'
                disabled={isLoading}
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-sm text-gray-500">
                {t("handler_args_description")}
              </p>
            </div>

            <FormField
              control={form.control}
              name="context_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("context_type")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger ref={field.ref}>
                        <SelectValue placeholder={t("select_context_type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AnalyticsContextType).map(
                        (contextType) => (
                          <SelectItem key={contextType} value={contextType}>
                            {contextType}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t("context_mapping")}
              </label>
              <Textarea
                value={contextMappingJson}
                onChange={(e) => setContextMappingJson(e.target.value)}
                placeholder='{"key": "value"}'
                disabled={isLoading}
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-sm text-gray-500">
                {t("context_mapping_description")}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t("metadata")}
              </label>
              <Textarea
                value={metadataJson}
                onChange={(e) => setMetadataJson(e.target.value)}
                placeholder='{"key": "value"}'
                disabled={isLoading}
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-sm text-gray-500">
                {t("metadata_description")}
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/analytics_config")}
                disabled={isLoading}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <CareIcon icon="l-spinner" className="animate-spin mr-2" />
                    {t("saving")}
                  </>
                ) : isEditing ? (
                  t("update_analytics_config")
                ) : (
                  t("create_analytics_config")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Page>
  );
}
