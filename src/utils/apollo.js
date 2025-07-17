import { InMemoryCache, ApolloClient, HttpLink } from '@apollo/client';
import { useMemo } from 'react';

export function createApolloClient(ssrMode = false) {
  return new ApolloClient({
    ssrMode,
    link: new HttpLink({
      uri: process.env.REACT_APP_SUBGRAPH_URL, // Correct variable name
      headers: process.env.REACT_APP_GRAPH_API_KEY
        ? {
            Authorization: `Bearer ${process.env.REACT_APP_GRAPH_API_KEY}`,
          }
        : {},
    }),
    cache: new InMemoryCache(),
  });
}

export function useApollo() {
  return useMemo(() => createApolloClient(false), []);
}
