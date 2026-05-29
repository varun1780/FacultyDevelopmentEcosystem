package com.aifdphub.repository;

import com.aifdphub.model.FdpModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FdpModuleRepository extends JpaRepository<FdpModule, Long> {
    List<FdpModule> findByFdpProgramIdOrderByOrderIndexAsc(Long fdpId);
    long countByFdpProgramId(Long fdpId);
    @org.springframework.transaction.annotation.Transactional
    void deleteByFdpProgramId(Long fdpId);
}
