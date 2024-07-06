import * as React from "react";

// const COMPONENT_CDN = process.env.COMPONENT_CDN || "";

// Changed to get styles from local, instead of CDN, so they can be modified.
export const hrefToComponentStyles = `global.css`;

type WithComponentStylesProps = {
  children?: React.ReactNode;
};

export const WithComponentStyles: React.FC<WithComponentStylesProps> = ({
  children,
}) => (
  <div>
    <link rel="stylesheet" href={hrefToComponentStyles}></link>
    <div className="duffel-components">{children}</div>
  </div>
);
