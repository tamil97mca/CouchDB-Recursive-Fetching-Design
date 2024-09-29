import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { map, expand, reduce, catchError, mergeMap } from 'rxjs/operators';
import {
  ObjectHierarchyJSON,
  Relationship,
} from './src/Models/ObjectHierarchyJSON';

@Injectable({
  providedIn: 'root',
})
export class CouchDbService {
  private couchDbUrl = 'http://localhost:5984/your-database'; // Replace with your CouchDB URL
  private batchSize = 100; // Define the batch size for fetching records

  constructor(private http: HttpClient) {}

  // Main method to fetch primary object with relationships, handling pagination
  fetchPrimaryObjectWithRelationships(
    hierarchyJson: ObjectHierarchyJSON
  ): Observable<any[]> {
    const primaryQuery =
      `type:${hierarchyJson.primaryObject.objectId} ${hierarchyJson.primaryObject.additionalQuery}`.trim();
    return this.recursiveFetchByQuery(primaryQuery).pipe(
      mergeMap((primaryObjects: any[]) => {
        const relationshipFetches = primaryObjects.map((primaryObject) =>
          this.embedRelationships(primaryObject, hierarchyJson.relationships)
        );
        return forkJoin(relationshipFetches);
      }),
      catchError(this.handleError)
    );
  }

  // Recursive fetch method to handle large data sets with pagination
  private recursiveFetchByQuery(
    query: string,
    bookmark: string = ''
  ): Observable<any[]> {
    const searchUrl = `${this.couchDbUrl}/_design/relationshipSearch/_search/objectSearch`;

    return this.http
      .get<any>(searchUrl, {
        params: {
          q: query,
          limit: this.batchSize.toString(),
          bookmark: bookmark,
        },
      })
      .pipe(
        map((response: any) => ({
          docs: response.rows.map((row: any) => row.doc),
          bookmark: response.bookmark,
        })),
        expand((data) =>
          data.docs.length === this.batchSize
            ? this.recursiveFetchByQuery(query, data.bookmark)
            : of(null)
        ),
        reduce((acc, data) => (data ? acc.concat(data) : acc), [] as any[]),
        catchError(this.handleError)
      );
  }

  // Embed relationships into the primary object
  private embedRelationships(
    primaryObject: any,
    relationships: Relationship[]
  ): Observable<any> {
    const relatedFetches = relationships.map((relationship) => {
      const foreignKeyField = relationship.foreignKey;
      const relatedQuery = `type:${relationship.objectId} AND ${
        relationship.relationshipType === 'MANY_TO_ONE'
          ? '_id'
          : foreignKeyField
      }:${
        relationship.relationshipType === 'MANY_TO_ONE'
          ? primaryObject[foreignKeyField]
          : primaryObject._id
      } ${relationship.additionalQuery}`.trim();

      return this.recursiveFetchByQuery(relatedQuery).pipe(
        map((relatedDocs: any[]) => {
          if (relatedDocs && relatedDocs.length > 0) {
            if (
              relationship.relationshipType === 'ONE_TO_ONE' ||
              relationship.relationshipType === 'MANY_TO_ONE'
            ) {
              primaryObject[foreignKeyField] = relatedDocs[0];
            } else if (relationship.relationshipType === 'ONE_TO_MANY') {
              primaryObject[foreignKeyField] = relatedDocs;
            }
          }
          return primaryObject;
        })
      );
    });

    return forkJoin(relatedFetches).pipe(
      map(() => primaryObject),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
