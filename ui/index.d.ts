import { UiNode, UiNodeAttributes, UiNodeAnchorAttributes, UiNodeImageAttributes, UiNodeInputAttributes, UiNodeTextAttributes, UiNodeScriptAttributes, UiNodeGroupEnum, UiNodeInputAttributesTypeEnum } from '@ory/client';

/**
 * Returns the node's label.
 *
 * @param node
 * @return label
 */
declare const getNodeLabel: (node: UiNode) => string;
/**
 * A TypeScript type guard for nodes of the type <a>
 *
 * @param attrs
 */
declare function isUiNodeAnchorAttributes(attrs: UiNodeAttributes): attrs is UiNodeAnchorAttributes & {
    node_type: "a";
};
/**
 * A TypeScript type guard for nodes of the type <img>
 *
 * @param attrs
 */
declare function isUiNodeImageAttributes(attrs: UiNodeAttributes): attrs is UiNodeImageAttributes & {
    node_type: "img";
};
/**
 * A TypeScript type guard for nodes of the type <input>
 *
 * @param attrs
 */
declare function isUiNodeInputAttributes(attrs: UiNodeAttributes): attrs is UiNodeInputAttributes & {
    node_type: "input";
};
/**
 * A TypeScript type guard for nodes of the type <span>{text}</span>
 *
 * @param attrs
 */
declare function isUiNodeTextAttributes(attrs: UiNodeAttributes): attrs is UiNodeTextAttributes & {
    node_type: "text";
};
/**
 * A TypeScript type guard for nodes of the type <script>
 *
 * @param attrs
 */
declare function isUiNodeScriptAttributes(attrs: UiNodeAttributes): attrs is UiNodeScriptAttributes & {
    node_type: "script";
};
/**
 * Returns a node's ID.
 *
 * @param attributes
 */
declare function getNodeId({ attributes }: UiNode): string;
/**
 * Return the node input attribute type
 * In <input> elements we have a variety of types, such as text, password, email, etc.
 * When the attribute is null or the `type` attribute is not present, we assume it has no defined type.
 * @param attr
 * @returns type of node
 */
declare const getNodeInputType: (attr: any) => string;
type FilterNodesByGroups = {
    nodes: Array<UiNode>;
    groups?: Array<UiNodeGroupEnum | string> | UiNodeGroupEnum | string;
    withoutDefaultGroup?: boolean;
    attributes?: Array<UiNodeInputAttributesTypeEnum | string> | UiNodeInputAttributesTypeEnum | string;
    withoutDefaultAttributes?: boolean;
    excludeAttributes?: Array<UiNodeInputAttributesTypeEnum | string> | UiNodeInputAttributesTypeEnum | string;
};
/**
 * Filters nodes by their groups and attributes.
 * If no filtering options are specified, all nodes are returned.
 * Will always add default nodes unless `withoutDefaultGroup` is true.
 * Will always add default attributes unless `withoutDefaultAttributes` is true.
 * @param {Object} filterNodesByGroups - An object containing the nodes and the filtering options.
 * @param {Array<UiNode>} filterNodesByGroups.nodes - An array of nodes.
 * @param {Array<UiNodeGroupEnum | string> | string} filterNodesByGroups.groups - An array or comma seperated strings of groups to filter by.
 * @param {boolean} filterNodesByGroups.withoutDefaultGroup - If true, will not add default nodes under the 'default' category.
 * @param {Array<UiNodeInputAttributesTypeEnum | string> | string} filterNodesByGroups.attributes - An array or comma seperated strings of attributes to filter by.
 * @param {boolean} filterNodesByGroups.withoutDefaultAttributes - If true, will not add default attributes such as 'hidden' and 'script'.
 */
declare const filterNodesByGroups: ({ nodes, groups, withoutDefaultGroup, attributes, withoutDefaultAttributes, excludeAttributes, }: FilterNodesByGroups) => UiNode[];

export { type FilterNodesByGroups, filterNodesByGroups, getNodeId, getNodeInputType, getNodeLabel, isUiNodeAnchorAttributes, isUiNodeImageAttributes, isUiNodeInputAttributes, isUiNodeScriptAttributes, isUiNodeTextAttributes };
