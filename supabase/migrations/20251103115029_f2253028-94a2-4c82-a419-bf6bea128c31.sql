-- Fix RLS policy for tenants table to allow first-time tenant creation
-- Drop the existing ALL policy that's too restrictive
DROP POLICY IF EXISTS "Tenants manageable by tenant admins" ON public.tenants;

-- Create separate policies for each operation
-- Allow INSERT only for users who don't have a tenant yet (onboarding)
CREATE POLICY "Users can create first tenant"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must not already have a tenant
  get_user_tenant(auth.uid()) IS NULL
);

-- Allow UPDATE and DELETE only for tenant admins of their own tenant
CREATE POLICY "Tenant admins can manage their tenant"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  id = get_user_tenant(auth.uid()) 
  AND has_role(auth.uid(), 'tenant_admin'::app_role)
);

CREATE POLICY "Tenant admins can delete their tenant"
ON public.tenants
FOR DELETE
TO authenticated
USING (
  id = get_user_tenant(auth.uid()) 
  AND has_role(auth.uid(), 'tenant_admin'::app_role)
);