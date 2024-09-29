export interface ObjectDefinition {
  objectId: string;
  objectName: string;
  objectType: 'PRIMARY' | 'HEADER' | 'MASTERDETAIL' | 'LOOKUP';
  additionalQuery: string;
}

export interface Relationship extends Omit<ObjectDefinition, 'objectType'> {
  objectType: 'HEADER' | 'MASTERDETAIL' | 'LOOKUP';
  relationshipType: 'ONE_TO_ONE' | 'MANY_TO_ONE' | 'ONE_TO_MANY';
  foreignKey: string;
}

export interface ObjectHierarchyJSON {
  primaryObject: ObjectDefinition;
  relationships: Relationship[];
}
