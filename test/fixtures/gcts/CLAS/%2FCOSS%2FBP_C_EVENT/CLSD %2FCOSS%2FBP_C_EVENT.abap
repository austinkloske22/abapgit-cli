class-pool .
*"* class pool for class /COSS/BP_C_EVENT

*"* local type definitions
include /COSS/BP_C_EVENT==============ccdef.

*"* class /COSS/BP_C_EVENT definition
*"* public declarations
  include /COSS/BP_C_EVENT==============cu.
*"* protected declarations
  include /COSS/BP_C_EVENT==============co.
*"* private declarations
  include /COSS/BP_C_EVENT==============ci.
endclass. "/COSS/BP_C_EVENT definition

*"* macro definitions
include /COSS/BP_C_EVENT==============ccmac.
*"* local class implementation
include /COSS/BP_C_EVENT==============ccimp.

*"* test class
include /COSS/BP_C_EVENT==============ccau.

class /COSS/BP_C_EVENT implementation.
*"* method's implementations
  include methods.
endclass. "/COSS/BP_C_EVENT implementation
