class-pool .
*"* class pool for class /COSS/BP_R_EVENT

*"* local type definitions
include /COSS/BP_R_EVENT==============ccdef.

*"* class /COSS/BP_R_EVENT definition
*"* public declarations
  include /COSS/BP_R_EVENT==============cu.
*"* protected declarations
  include /COSS/BP_R_EVENT==============co.
*"* private declarations
  include /COSS/BP_R_EVENT==============ci.
endclass. "/COSS/BP_R_EVENT definition

*"* macro definitions
include /COSS/BP_R_EVENT==============ccmac.
*"* local class implementation
include /COSS/BP_R_EVENT==============ccimp.

*"* test class
include /COSS/BP_R_EVENT==============ccau.

class /COSS/BP_R_EVENT implementation.
*"* method's implementations
  include methods.
endclass. "/COSS/BP_R_EVENT implementation
