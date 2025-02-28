/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as SignInImport } from './routes/sign-in'
import { Route as PostsImport } from './routes/posts'
import { Route as AuthenticatedImport } from './routes/_authenticated'
import { Route as IndexImport } from './routes/index'
import { Route as CNameImport } from './routes/c/$name'
import { Route as AuthenticatedSignOutImport } from './routes/_authenticated/sign-out'
import { Route as AuthenticatedProfileImport } from './routes/_authenticated/profile'
import { Route as AuthenticatedCreatePostImport } from './routes/_authenticated/create-post'

// Create/Update Routes

const SignInRoute = SignInImport.update({
  id: '/sign-in',
  path: '/sign-in',
  getParentRoute: () => rootRoute,
} as any)

const PostsRoute = PostsImport.update({
  id: '/posts',
  path: '/posts',
  getParentRoute: () => rootRoute,
} as any)

const AuthenticatedRoute = AuthenticatedImport.update({
  id: '/_authenticated',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const CNameRoute = CNameImport.update({
  id: '/c/$name',
  path: '/c/$name',
  getParentRoute: () => rootRoute,
} as any)

const AuthenticatedSignOutRoute = AuthenticatedSignOutImport.update({
  id: '/sign-out',
  path: '/sign-out',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedProfileRoute = AuthenticatedProfileImport.update({
  id: '/profile',
  path: '/profile',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedCreatePostRoute = AuthenticatedCreatePostImport.update({
  id: '/create-post',
  path: '/create-post',
  getParentRoute: () => AuthenticatedRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/_authenticated': {
      id: '/_authenticated'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthenticatedImport
      parentRoute: typeof rootRoute
    }
    '/posts': {
      id: '/posts'
      path: '/posts'
      fullPath: '/posts'
      preLoaderRoute: typeof PostsImport
      parentRoute: typeof rootRoute
    }
    '/sign-in': {
      id: '/sign-in'
      path: '/sign-in'
      fullPath: '/sign-in'
      preLoaderRoute: typeof SignInImport
      parentRoute: typeof rootRoute
    }
    '/_authenticated/create-post': {
      id: '/_authenticated/create-post'
      path: '/create-post'
      fullPath: '/create-post'
      preLoaderRoute: typeof AuthenticatedCreatePostImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/profile': {
      id: '/_authenticated/profile'
      path: '/profile'
      fullPath: '/profile'
      preLoaderRoute: typeof AuthenticatedProfileImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/sign-out': {
      id: '/_authenticated/sign-out'
      path: '/sign-out'
      fullPath: '/sign-out'
      preLoaderRoute: typeof AuthenticatedSignOutImport
      parentRoute: typeof AuthenticatedImport
    }
    '/c/$name': {
      id: '/c/$name'
      path: '/c/$name'
      fullPath: '/c/$name'
      preLoaderRoute: typeof CNameImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

interface AuthenticatedRouteChildren {
  AuthenticatedCreatePostRoute: typeof AuthenticatedCreatePostRoute
  AuthenticatedProfileRoute: typeof AuthenticatedProfileRoute
  AuthenticatedSignOutRoute: typeof AuthenticatedSignOutRoute
}

const AuthenticatedRouteChildren: AuthenticatedRouteChildren = {
  AuthenticatedCreatePostRoute: AuthenticatedCreatePostRoute,
  AuthenticatedProfileRoute: AuthenticatedProfileRoute,
  AuthenticatedSignOutRoute: AuthenticatedSignOutRoute,
}

const AuthenticatedRouteWithChildren = AuthenticatedRoute._addFileChildren(
  AuthenticatedRouteChildren,
)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '': typeof AuthenticatedRouteWithChildren
  '/posts': typeof PostsRoute
  '/sign-in': typeof SignInRoute
  '/create-post': typeof AuthenticatedCreatePostRoute
  '/profile': typeof AuthenticatedProfileRoute
  '/sign-out': typeof AuthenticatedSignOutRoute
  '/c/$name': typeof CNameRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '': typeof AuthenticatedRouteWithChildren
  '/posts': typeof PostsRoute
  '/sign-in': typeof SignInRoute
  '/create-post': typeof AuthenticatedCreatePostRoute
  '/profile': typeof AuthenticatedProfileRoute
  '/sign-out': typeof AuthenticatedSignOutRoute
  '/c/$name': typeof CNameRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/_authenticated': typeof AuthenticatedRouteWithChildren
  '/posts': typeof PostsRoute
  '/sign-in': typeof SignInRoute
  '/_authenticated/create-post': typeof AuthenticatedCreatePostRoute
  '/_authenticated/profile': typeof AuthenticatedProfileRoute
  '/_authenticated/sign-out': typeof AuthenticatedSignOutRoute
  '/c/$name': typeof CNameRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | ''
    | '/posts'
    | '/sign-in'
    | '/create-post'
    | '/profile'
    | '/sign-out'
    | '/c/$name'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | ''
    | '/posts'
    | '/sign-in'
    | '/create-post'
    | '/profile'
    | '/sign-out'
    | '/c/$name'
  id:
    | '__root__'
    | '/'
    | '/_authenticated'
    | '/posts'
    | '/sign-in'
    | '/_authenticated/create-post'
    | '/_authenticated/profile'
    | '/_authenticated/sign-out'
    | '/c/$name'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AuthenticatedRoute: typeof AuthenticatedRouteWithChildren
  PostsRoute: typeof PostsRoute
  SignInRoute: typeof SignInRoute
  CNameRoute: typeof CNameRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AuthenticatedRoute: AuthenticatedRouteWithChildren,
  PostsRoute: PostsRoute,
  SignInRoute: SignInRoute,
  CNameRoute: CNameRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/_authenticated",
        "/posts",
        "/sign-in",
        "/c/$name"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/_authenticated": {
      "filePath": "_authenticated.tsx",
      "children": [
        "/_authenticated/create-post",
        "/_authenticated/profile",
        "/_authenticated/sign-out"
      ]
    },
    "/posts": {
      "filePath": "posts.tsx"
    },
    "/sign-in": {
      "filePath": "sign-in.tsx"
    },
    "/_authenticated/create-post": {
      "filePath": "_authenticated/create-post.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/profile": {
      "filePath": "_authenticated/profile.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/sign-out": {
      "filePath": "_authenticated/sign-out.tsx",
      "parent": "/_authenticated"
    },
    "/c/$name": {
      "filePath": "c/$name.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
