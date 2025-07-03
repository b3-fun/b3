"use client";

import * as React from "react";

declare module "react-timeago" {
  export interface TimeAgoProps {
    date: Date | string | number;
    formatter?: (value: number, unit: string, suffix: string) => string;
    component?: string | React.ComponentType<any>;
    live?: boolean;
    minPeriod?: number;
    maxPeriod?: number;
    title?: string;
    [key: string]: any;
  }

  export default class TimeAgo extends React.Component<TimeAgoProps> {}
}
