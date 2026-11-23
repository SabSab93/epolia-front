export interface IServiceDomainDto {
  id: string
  label: string
}

export interface IStudentServiceDto extends IServiceDomainDto {
  domainId: string
}

export interface IServiceSelectionDto {
  revision: string | null
  domainId: string | null
  domains: IServiceDomainDto[]
  eligible: IStudentServiceDto[]
  selected: IStudentServiceDto[]
}
