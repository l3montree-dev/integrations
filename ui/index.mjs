const getNodeLabel = (node) => {
  const attributes = node.attributes;
  if (isUiNodeAnchorAttributes(attributes)) {
    return attributes.title.text;
  }
  if (isUiNodeImageAttributes(attributes)) {
    return node.meta.label?.text || "";
  }
  if (isUiNodeInputAttributes(attributes)) {
    if (attributes.label?.text) {
      return attributes.label.text;
    }
  }
  return node.meta.label?.text || "";
};
function isUiNodeAnchorAttributes(attrs) {
  return attrs.node_type === "a";
}
function isUiNodeImageAttributes(attrs) {
  return attrs.node_type === "img";
}
function isUiNodeInputAttributes(attrs) {
  return attrs.node_type === "input";
}
function isUiNodeTextAttributes(attrs) {
  return attrs.node_type === "text";
}
function isUiNodeScriptAttributes(attrs) {
  return attrs.node_type === "script";
}
function getNodeId({ attributes }) {
  if (isUiNodeInputAttributes(attributes)) {
    return attributes.name;
  } else {
    return attributes.id;
  }
}
const getNodeInputType = (attr) => attr?.["type"] ?? "";
const filterNodesByGroups = ({
  nodes,
  groups,
  withoutDefaultGroup,
  attributes,
  withoutDefaultAttributes,
  excludeAttributes
}) => {
  const search = (s) => typeof s === "string" ? s.split(",") : s;
  return nodes.filter(({ group, attributes: attr }) => {
    if (!groups && !attributes && !excludeAttributes)
      return true;
    const g = search(groups) || [];
    if (!withoutDefaultGroup) {
      g.push("default");
    }
    const a = search(attributes) || [];
    if (!withoutDefaultAttributes) {
      if (group.includes("default")) {
        a.push("hidden");
      }
      if (group.includes("webauthn") || group.includes("totp")) {
        a.push("input", "script");
      }
    }
    const ea = search(excludeAttributes) || [];
    const filterGroup = groups ? g.includes(group) : true;
    const filterAttributes = attributes ? a.includes(getNodeInputType(attr)) : true;
    const filterExcludeAttributes = excludeAttributes ? !ea.includes(getNodeInputType(attr)) : true;
    return filterGroup && filterAttributes && filterExcludeAttributes;
  });
};

export { filterNodesByGroups, getNodeId, getNodeInputType, getNodeLabel, isUiNodeAnchorAttributes, isUiNodeImageAttributes, isUiNodeInputAttributes, isUiNodeScriptAttributes, isUiNodeTextAttributes };
//# sourceMappingURL=index.mjs.map
