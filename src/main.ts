import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CouchDbService } from '../CouchDbService';
import { ObjectHierarchyJSON } from './Models/ObjectHierarchyJSON';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  providers: [CouchDbService],
  template: `
    <h1>Hello from {{ name }}!</h1>
    <a target="_blank" href="https://angular.dev/overview">
      Learn more about Angular
    </a>
  `,
})
export class App {
  name = 'Angular';

  objectHierarchyJSON: ObjectHierarchyJSON = {
    primaryObject: {
      objectId: 'pfm456',
      objectName: 'Employee',
      objectType: 'PRIMARY',
      additionalQuery: 'type:pfm456 AND isActive:true',
    },
    relationships: [
      {
        objectId: 'pfm123',
        objectName: 'Organization',
        objectType: 'HEADER',
        relationshipType: 'ONE_TO_MANY',
        foreignKey: 'pfm123',
        additionalQuery: 'type:pfm123 AND isActive:true',
      },
      {
        objectId: 'pfm789',
        objectName: 'Employee Additional Info',
        objectType: 'MASTERDETAIL',
        relationshipType: 'ONE_TO_ONE',
        foreignKey: 'pfm456',
        additionalQuery: 'type:pfm789 AND pfm456:{{_id}}',
      },
      {
        objectId: 'pfm987',
        objectName: 'Location',
        objectType: 'LOOKUP',
        relationshipType: 'MANY_TO_ONE',
        foreignKey: 'pfm987',
        additionalQuery: 'type:pfm987 AND _id:{{pfm987}}',
      },
    ],
  };

  constructor(public dbService: CouchDbService) {
    this.dbService.fetchPrimaryObjectWithRelationships(
      this.objectHierarchyJSON
    );
  }
}

bootstrapApplication(App);
