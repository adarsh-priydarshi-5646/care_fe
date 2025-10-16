export enum AnalyticsHandler {
  metabase = "metabase",
}

export enum AnalyticsContextType {
  facility = "facility",
  organization = "organization",
}

export interface AnalyticsConfigBase {
  name: string;
  description?: string;
  handler: AnalyticsHandler;
  handler_args: {
    [key: string]: string;
  };
  context_type: AnalyticsContextType;
  context_mapping: {
    [key: string]: string;
  };
  metadata: {
    [key: string]: string;
  };
}

export interface AnalyticsConfigRead extends AnalyticsConfigBase {
  id: string;
}

export type AnalyticsConfigCreate = AnalyticsConfigBase;

export type AnalyticsUrlResponse = {
  redirect_url: string;
};
